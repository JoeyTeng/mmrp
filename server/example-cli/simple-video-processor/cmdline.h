/*
  Copyright (c) 2009, Hideyuki Tanaka
  All rights reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:
  * Redistributions of source code must retain the above copyright
  notice, this list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright
  notice, this list of conditions and the following disclaimer in the
  documentation and/or other materials provided with the distribution.
  * Neither the name of the <organization> nor the
  names of its contributors may be used to endorse or promote products
  derived from this software without specific prior written permission.

  THIS SOFTWARE IS PROVIDED BY <copyright holder> ''AS IS'' AND ANY
  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED. IN NO EVENT SHALL <copyright holder> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

#pragma once

#include <cassert>
#include <iostream>
#include <iomanip>
#include <iterator>
#include <sstream>
#include <vector>
#include <map>
#include <memory>
#include <string>
#include <stdexcept>
#include <tuple>
#include <typeinfo>
#include <type_traits>
#include <cstring>
#include <algorithm>
#ifdef __GNUC__
#include <cxxabi.h>
#endif
#include <cstdlib>

namespace cmdline {

using namespace std::string_literals;

namespace detail {

template <typename Target, typename Source, bool Same>
class lexical_cast_t {
 public:
  static Target cast(const Source &arg) {
    std::ostringstream ss;
    ss << arg;
    return lexical_cast_t<Target, std::string, false>::cast(ss.str());
  }
};

template <typename Target, typename Source>
class lexical_cast_t<Target, Source, true> {
 public:
  static Target cast(const Source &arg) { return arg; }
};

template <typename Source>
class lexical_cast_t<std::string, Source, false> {
 public:
  static std::string cast(const Source &arg) {
    std::ostringstream ss;
    ss << arg;
    return ss.str();
  }
};

template <typename Target>
class lexical_cast_t<Target, std::string, false> {
 public:
  static Target cast(const std::string &arg) {
    if constexpr (std::is_same<Target, char>::value) {
      if (arg.size() != 1) throw std::bad_cast();
      return arg[0];
    }

    Target ret;
    std::istringstream ss(arg);
    if (!(ss >> std::setbase(0) >> ret && ss.eof())) throw std::bad_cast();
    return ret;
  }
};

template <typename Target, typename Source>
Target lexical_cast(const Source &arg) {
  return lexical_cast_t<Target, Source, std::is_same<Target, Source>::value>::cast(arg);
}

static inline std::string demangle(const std::string &name) {
#ifdef _MSC_VER
  return name;  // return name when compiled using MSVC
#elif defined(__GNUC__)
  // use original code when compiled using gcc
  int status = 0;
  char *p = abi::__cxa_demangle(name.c_str(), 0, 0, &status);
  std::string ret(p);
  free(p);
  return ret;
#else
  // For all other unsupported compilers, they need to implement this function.
#error unexpected c compiler (msc/gcc), Need to implement this method for demangle
#endif
}

template <class T>
std::string readable_typename() {
  return demangle(typeid(T).name());
}

template <class T>
std::string default_value(T def) {
  return detail::lexical_cast<std::string>(def);
}

template <>
inline std::string readable_typename<std::string>() {
  return "string";
}

}  // namespace detail

//-----

class cmdline_error : public std::exception {
 public:
  cmdline_error(const std::string &message) : msg(message) {}
  ~cmdline_error() throw() {}
  const char *what() const throw() { return msg.c_str(); }

 private:
  std::string msg;
};

class early_exit : public std::exception {
 public:
  early_exit(const int exit_code) : code(exit_code) {}
  ~early_exit() throw() {}
  const char *what() const throw() override { return "Early Exit from cmdline.h"; }
  int exit_code() const { return code; }

 private:
  int code;
};

template <class T>
struct default_reader {
  const std::string restriction_text() const { return ""s; }

  T operator()(const std::string &str) const { return detail::lexical_cast<T>(str); }
};

template <class T>
struct range_reader {
  range_reader(const T &lower_bound, const T &higher_bound) : low(lower_bound), high(higher_bound) {}
  T operator()(const std::string &s) const {
    T ret = default_reader<T>()(s);
    if (!(ret >= low && ret <= high)) throw cmdline::cmdline_error("is out of range");
    return ret;
  }

  const std::string restriction_text() const {
    std::ostringstream oss;
    oss << "within [" << low << ", " << high << "]";

    return oss.str();
  }

 private:
  const T low, high;
};

template <class T>
range_reader<T> range(const T &low, const T &high) {
  return range_reader<T>(low, high);
}

template <class T>
struct oneof_reader {
  T operator()(const std::string &s) const {
    T ret = default_reader<T>()(s);
    if (std::find(alt.begin(), alt.end(), ret) == alt.end()) throw cmdline_error("is not a valid option");
    return ret;
  }
  void add(const T &v) { alt.push_back(v); }

  const std::string restriction_text() const {
    if (alt.empty()) {
      return ""s;
    }

    std::ostringstream oss;
    oss << "one of {";
    for (auto &&v : alt) {
      oss << v << ", ";
    }
    std::string ret(oss.str());
    ret.pop_back();    // remove last space
    ret.back() = '}';  // and replace last comma with '}'

    return ret;
  }

 private:
  std::vector<T> alt;
};

template <class T>
oneof_reader<T> oneof(T a1) {
  oneof_reader<T> ret;
  ret.add(a1);
  return ret;
}

template <class T, typename... Ts>
oneof_reader<T> oneof(T a1, Ts... other_options) {
  auto ret = oneof(other_options...);
  ret.add(a1);
  return ret;
}

//-----

using num_of_values_t = std::tuple<size_t, size_t>;
static constexpr num_of_values_t DEFAULT_NUM_OF_VALUES = { 0, SIZE_MAX };

class parser {
 public:
  parser() : options(), ordered(), ftr(), provided_program_name(false), prog_name(), others(), errors() {}

  void add(const std::string &name, char short_name = 0, const std::string &desc = "") {
    if (options.count(name)) throw cmdline_error("multiple definition: " + name);
    options[name] = std::make_shared<option_without_value>(name, short_name, desc);
    ordered.push_back(options[name]);
  }

  template <class T>
  void add(const std::string &name, char short_name = 0, const std::string &desc = "", bool need = true, const T def = T()) {
    add(name, short_name, desc, need, def, default_reader<T>());
  }

  template <class T, class F>
  void add(const std::string &name, char short_name = 0, const std::string &desc = "", bool need = true, const T def = T(),
           F reader = F()) {
    if (options.count(name)) throw cmdline_error("multiple definition: " + name);
    options[name] = std::make_shared<option_with_value_with_reader<T, F>>(name, short_name, need, def, desc, reader);
    ordered.push_back(options[name]);
  }

  template <class T, class F = default_reader<T>>
  void add_multi_values(const std::string &name, char short_name = 0, const std::string &desc = "", bool need = true,
                        const std::vector<T> def = {}, num_of_values_t num_of_values = DEFAULT_NUM_OF_VALUES, F reader = F()) {
    if (options.count(name)) throw cmdline_error("multiple definition: " + name);
    options[name] =
        std::make_shared<option_with_multiple_value_with_reader<T, F>>(name, short_name, need, def, desc, reader, num_of_values);
    ordered.push_back(options[name]);
  }

  void footer(const std::string &f) { ftr = f; }

  void set_program_name(const std::string &name) {
    provided_program_name = true;
    prog_name = name;
  }

  bool exist(const std::string &name) const {
    if (options.count(name) == 0) throw cmdline_error("there is no flag: --" + name);
    return options.find(name)->second->has_set();
  }

  template <class T>
  const T &get(const std::string &name) const {
    if (options.count(name) == 0) throw cmdline_error("there is no flag: --" + name);
    auto p = std::dynamic_pointer_cast<const option_with_value<T>>(options.find(name)->second);
    if (!p)
      throw cmdline_error("type mismatch flag '" + name + "'. Trying to retrieve single-value option with type " +
                          detail::readable_typename<T>() + ". "s);
    return p->get();
  }

  /**
   * @brief Get the argument values of argument [name] as a reference to vector.
   *
   * @tparam T
   * @param name
   * @return const std::vector<T>&
   * @warning The return value is a reference, not a copy. If further actions (parse/parse_check) are taken then the value inside may
   * change. If you actively change the value inside, the value may change as well.
   */
  template <class T>
  const std::vector<T> &get_multi_values(const std::string &name) const {
    if (options.count(name) == 0) throw cmdline_error("there is no flag: --" + name);
    auto p = std::dynamic_pointer_cast<const option_with_multiple_value<T>>(options.find(name)->second);
    if (!p)
      throw cmdline_error("type mismatch flag '" + name + "'. Trying to retrieve multi-value option with type " +
                          detail::readable_typename<T>() + ". "s);
    return p->get();
  }

  const std::vector<std::string> &rest() const { return others; }

  /**
   * @brief Reset all added options, clear internal states as if all the options are added without `parse` or `parse_check` called.
   */
  void reset_options() {
    errors.clear();
    others.clear();
    if (!provided_program_name) {
      prog_name.clear();
    }

    for (const auto &option : ordered) {
      option->reset();
    }
  }

  bool parse(const std::string &arg, bool reset_before_parse = true) {
    if (reset_before_parse) {
      reset_options();
    }

    std::vector<std::string> args;

    std::string buf;
    bool in_quote = false;
    for (std::string::size_type i = 0; i < arg.length(); i++) {
      if (arg[i] == '\"') {
        in_quote = !in_quote;
        continue;
      }

      if (arg[i] == ' ' && !in_quote) {
        args.push_back(buf);
        buf = "";
        continue;
      }

      if (arg[i] == '\\') {
        i++;
        if (i >= arg.length()) {
          errors.push_back("unexpected occurrence of '\\' at end of string");
          return false;
        }
      }

      buf += arg[i];
    }

    if (in_quote) {
      errors.push_back("quote is not closed");
      return false;
    }

    if (buf.length() > 0) args.push_back(buf);

    return parse(args, false);
  }

  bool parse(const std::vector<std::string> &args, bool reset_before_parse = true) {
    int argc = static_cast<int>(args.size());
    std::vector<const char *> argv(argc);

    for (int i = 0; i < argc; i++) argv[i] = args[i].c_str();

    return parse(argc, &argv[0], reset_before_parse);
  }

  bool parse(int argc, const char *const argv[], bool reset_before_parse = true) {
    if (reset_before_parse) {
      reset_options();
    } else {
      errors.clear();
      others.clear();
    }

    if (argc < 1) {
      errors.push_back("argument number must be longer than 0");
      return false;
    }
    if (!provided_program_name) {
      prog_name = argv[0];
    }

    std::map<char, std::string> lookup;
    for (const auto &[key, value] : options) {
      if (key.length() == 0) continue;
      char initial = value->short_name();
      if (initial) {
        if (lookup.count(initial) > 0) {
          lookup[initial] = "";
          errors.push_back(std::string("short option '") + initial + "' is ambiguous");
          return false;
        } else
          lookup[initial] = key;
      }
    }

    for (int i = 1; i < argc; i++) {
      std::string name;

      // find arg name
      if (strncmp(argv[i], "--", 2) == 0) {
        // if in the form of --name=<value>, deal with it and take it as one value option
        const char *p = strchr(argv[i] + 2, '=');
        if (p) {
          std::string _name(argv[i] + 2, p);
          std::string val(p + 1);
          set_option(_name, val);
          continue;
        } else {
          name = argv[i] + 2;
        }
      } else if (strncmp(argv[i], "-", 1) == 0) {
        if (argv[i][1] == '\0') {
          others.push_back(argv[i]);
          continue;
        }
        // set all switches. e.g. -xvzf will set short options -x -v -z -f.
        char last = argv[i][1];
        for (int j = 2; argv[i][j] != '\0'; j++) {
          last = argv[i][j];
          if (lookup.count(argv[i][j - 1]) == 0) {
            errors.push_back(std::string("undefined short option: -") + argv[i][j - 1]);
            continue;
          }
          if (lookup[argv[i][j - 1]] == "") {
            errors.push_back(std::string("ambiguous short option: -") + argv[i][j - 1]);
            continue;
          }
          set_option(lookup[argv[i][j - 1]]);
        }

        if (lookup.count(last) == 0) {
          errors.push_back(std::string("undefined short option: -") + last);
          continue;
        }
        if (lookup[last] == "") {
          errors.push_back(std::string("ambiguous short option: -") + last);
          continue;
        }
        name = lookup[last];
      } else {
        others.push_back(argv[i]);
        continue;
      }

      if (i + 1 < argc && options.count(name) != 0 && options[name]->has_value()) {
        if (options[name]->has_multiple_values()) {
          int end = i + 1;
          // stop when:
          // 1. end == argc;
          // 2. argv[end] starts with --;
          // 3. argv[end] starts with - and not follows by a digit (thus not negative numbers)
          for (; end < argc && !(argv[end][0] == '-' && (argv[end][1] == '-' || !isdigit(argv[end][1]))); ++end)
            ;
          set_options(name, argv + i + 1, argv + end);
          i = end - 1;  // will +1 in next iteration of the loop
        } else {
          set_option(name, argv[i + 1]);
          i++;
        }
      } else {
        set_option(name);
      }
    }

    for (const auto &kv : options) {
      if (!kv.second->valid()) {
        errors.push_back(kv.second->error_message());
      }
    }

    return errors.size() == 0;
  }

  void parse_check(const std::string &arg, bool reset_before_parse = true) {
    if (!options.count("help")) add("help", '?', "print this message");
    check(0, parse(arg, reset_before_parse));
  }

  void parse_check(const std::vector<std::string> &args, bool reset_before_parse = true) {
    if (!options.count("help")) add("help", '?', "print this message");
    check((int)args.size(), parse(args, reset_before_parse));
  }

  void parse_check(int argc, char *argv[], bool reset_before_parse = true) {
    if (!options.count("help")) add("help", '?', "print this message");
    check(argc, parse(argc, argv, reset_before_parse));
  }

  std::string error() const { return errors.size() > 0 ? errors[0] : ""; }

  std::string error_full() const {
    std::ostringstream oss;
    for (size_t i = 0; i < errors.size(); i++) oss << errors[i] << std::endl;
    return oss.str();
  }

  std::string usage() const {
    std::ostringstream oss;
    oss << "usage: " << prog_name << " ";
    for (size_t i = 0; i < ordered.size(); i++) {
      if (ordered[i]->must()) oss << ordered[i]->short_description() << " ";
    }

    oss << "[options] ... " << ftr << std::endl;
    oss << "options:" << std::endl;

    size_t max_width = 0;
    for (size_t i = 0; i < ordered.size(); i++) {
      auto name_length = ordered[i]->name().length();
      max_width = max_width > name_length ? max_width : name_length;
    }
    for (size_t i = 0; i < ordered.size(); i++) {
      if (ordered[i]->short_name()) {
        oss << "  -" << ordered[i]->short_name() << ", ";
      } else {
        oss << "      ";
      }

      oss << "--" << ordered[i]->name();
      for (size_t j = ordered[i]->name().length(); j < max_width + 4; j++) oss << ' ';
      oss << ordered[i]->description() << std::endl;
    }
    return oss.str();
  }

 private:
  void check(int argc, bool ok) {
    if ((argc == 1 && !ok) || exist("help")) {
      std::cerr << usage();
      throw early_exit(0);
    }

    if (!ok) {
      std::cerr << error() << std::endl << usage();
      throw early_exit(1);
    }
  }

  void set_option(const std::string &name) {
    if (options.count(name) == 0) {
      errors.push_back("undefined option: --" + name);
      return;
    }
    if (!options[name]->set()) {
      errors.push_back("option needs value: --" + name);
      return;
    }
  }

  void set_option(const std::string &name, const std::string &value) {
    if (options.count(name) == 0) {
      errors.push_back("undefined option: --" + name);
      return;
    }
    if (!options[name]->set(value)) {
      errors.push_back("option value is invalid: --" + name + "=" + value + " " + options[name]->error_message());
      return;
    }
  }

  void set_options(const std::string &name, const char *const begin[], const char *const end[]) {
    assert(begin != end);

    if (options.count(name) == 0) {
      errors.push_back("undefined option: --" + name);
    } else if (!options[name]->has_multiple_values()) {
      std::ostringstream oss;
      oss << "option only accepts one value, " << std::distance(begin, end) << " values are specified: --" << name << "=";
      oss << *begin;
      for (auto it = begin + 1; it != end; ++it) {
        oss << ", " << *it;
      }
      oss << ".";
      errors.push_back(oss.str());
    } else {
      for (auto it = begin; it != end; ++it) {
        if (!options[name]->set(*it)) {
          errors.push_back("option value is invalid: --" + name + "=" + *it + " " + options[name]->error_message());
        }
      }
    }
  }

  class option_base {
   public:
    virtual ~option_base() {}

    /// @brief Option being a switch (false) or needs an value
    virtual bool has_value() const = 0;
    /// @brief Option can accept multiple values (a vector) or not
    virtual bool has_multiple_values() const = 0;
    /// @brief set switch option to be true
    /// @return true on success, false otherwise (and will set error_message)
    virtual bool set() = 0;
    /// @brief set value of an option if single value; append value on multi-values option
    /// @param value string representation of the value
    /// @return true on success, false otherwise (and will set error_message), due to reader restriction, bad cast, etc.
    virtual bool set(const std::string &value) = 0;
    /// @brief Reset the state of the option, as if it was just added. Thus if it an option with value and has default, `get` will give
    /// default. `has_set` will be reset to false as well. `error_message` will be clear.
    virtual void reset() = 0;
    /// @brief the option has been set
    virtual bool has_set() const = 0;
    /// @brief The option is valid: optional; must and been set; multi-value option and given number of values are within constraint. Will
    /// set error message when invalid.
    /// @note For *optional* multi-value option, returns false when some values are specified, but the number of it violates the constraint
    virtual bool valid() = 0;
    /// @brief compulsory option
    virtual bool must() const = 0;

    virtual const std::string &name() const = 0;
    virtual char short_name() const = 0;
    virtual const std::string &description() const = 0;
    /// @brief latest error message being set
    virtual const std::string error_message() const = 0;
    /// @brief switch "--<name>"; single value option "--<name>=<type>"; multi-values option"--<name>=<type>[]"
    virtual std::string short_description() const = 0;
  };

  class option_without_value : public option_base {
   public:
    option_without_value(const std::string &full_name, char short_name, const std::string &description)
        : nam(full_name), snam(short_name), desc(description), has(false) {}
    ~option_without_value() {}

    bool has_value() const { return false; }

    bool has_multiple_values() const { return false; }

    bool set() {
      _error_message.clear();
      has = true;
      return true;
    }

    bool set(const std::string &) {
      _error_message = "does not accept any value."s;
      return false;
    }

    void reset() {
      has = false;
      _error_message.clear();
    }

    bool has_set() const { return has; }

    bool valid() { return true; }

    bool must() const { return false; }

    const std::string &name() const { return nam; }

    char short_name() const { return snam; }

    const std::string &description() const { return desc; }

    const std::string error_message() const { return _error_message; }

    std::string short_description() const { return "--" + nam; }

   private:
    const std::string nam;
    const char snam;
    const std::string desc;
    bool has;
    std::string _error_message;
  };

  template <class T>
  class option_with_value : public option_base {
   public:
    option_with_value(const std::string &full_name, char short_name, bool is_needed, const T &default_value, const std::string &description)
        : nam(full_name), snam(short_name), need(is_needed), desc(full_description(description, is_needed, default_value)), has(false),
          def(default_value), actual(def) {}
    ~option_with_value() {}

    const T &get() const { return actual; }

    bool has_value() const { return true; }

    bool has_multiple_values() const { return false; }

    bool set() {
      _error_message = "option needs value"s;
      return false;
    }

    bool set(const std::string &value) {
      _error_message.clear();

      try {
        actual = read(value);
        has = true;
      } catch (const std::bad_cast &) {
        _error_message = "causes type mismatch, expecting "s + detail::readable_typename<T>() + ". "s;
        return false;
      } catch (const cmdline::cmdline_error &) {
        // _error_message set by the child class at throw site.
        return false;
      }

      return true;
    }

    void reset() {
      actual = def;
      has = false;
      _error_message.clear();
    }

    bool has_set() const { return has; }

    bool valid() {
      if (need && !has) {
        _error_message = "need option: --"s + nam;
        return false;
      }
      return true;
    }

    bool must() const { return need; }

    const std::string &name() const { return nam; }

    char short_name() const { return snam; }

    const std::string &description() const { return desc; }

    const std::string error_message() const { return _error_message; }

    std::string short_description() const { return "--" + nam + "=" + detail::readable_typename<T>(); }

   protected:
    static std::string full_description(const std::string &desc, bool must, const T &default_value) {
      return desc + " (" + detail::readable_typename<T>() + (must ? "" : " [=" + detail::default_value<T>(default_value) + "]") + ")";
    }

    virtual T read(const std::string &s) = 0;

    const std::string nam;
    const char snam;
    const bool need;
    const std::string desc;

    bool has;
    const T def;
    T actual;
    std::string _error_message;
  };

  template <class T, class F>
  class option_with_value_with_reader : public option_with_value<T> {
   public:
    option_with_value_with_reader(const std::string &full_name, char short_name, bool is_needed, const T default_value,
                                  const std::string &description, F value_reader)
        : option_with_value<T>(full_name, short_name, is_needed, default_value,
                               full_description(description, is_needed, default_value, value_reader)),
          reader(value_reader) {}

   private:
    static std::string full_description(const std::string &desc, bool must, const T &default_value, const F &reader) {
      const std::string restriction = reader.restriction_text();
      return desc + " (" + detail::readable_typename<T>() + (must ? "" : " [=" + detail::default_value<T>(default_value) + "]") +
             (restriction.empty() ? "" : ", must be " + restriction) + ")";
    }

    T read(const std::string &s) {
      this->_error_message.clear();
      try {
        return reader(s);
      } catch (const cmdline::cmdline_error &e) {
        this->_error_message = ""s + e.what() + ". Value must be " + reader.restriction_text() + "."s;
        throw;
      }
    }

    const F reader;
  };

  template <class T>
  class option_with_multiple_value : public option_base {
   public:
    option_with_multiple_value(const std::string &full_name, char short_name, bool is_needed, const std::vector<T> &default_value,
                               const std::string &description, const num_of_values_t &number_of_values)
        : _name(full_name), _short_name(short_name), _required(is_needed), _description(description), _number_of_values(number_of_values),
          _has(false), _default(default_value), _actual(default_value) {}
    ~option_with_multiple_value() {}

    const std::vector<T> &get() const { return _actual; }

    bool has_value() const { return true; }

    bool has_multiple_values() const { return true; }

    bool set() {
      if (!_has) {
        // only has default values, not set any value yet.
        _error_messages.clear();
        _has = true;
      }
      _error_messages.push_back("option needs value"s);
      return false;
    }

    bool set(const std::string &value) {
      if (!_has) {
        // only has default values, not set any value yet.
        _error_messages.clear();
        _actual.clear();
      }
      _has = true;

      try {
        _actual.push_back(read(value));
      } catch (const std::bad_cast &) {
        _error_messages.push_back("causes type mismatch, expecting "s + detail::readable_typename<T>() + ". "s);
        return false;
      } catch (const cmdline::cmdline_error &) {
        // _error_message set by the child class at throw site.
        return false;
      }

      return true;
    }

    void reset() {
      _actual.assign(_default.begin(), _default.end());
      _has = false;
      _error_messages.clear();
    }

    bool has_set() const { return _has; }

    bool valid() {
      if (_required && !_has) {
        _error_messages.push_back("need option: --" + _name);
        return false;
      }
      if (std::get<0>(_number_of_values) > _actual.size() || _actual.size() > std::get<1>(_number_of_values)) {
        std::ostringstream oss;
        oss << "option --" << _name << " expects ";
        if (std::get<0>(_number_of_values) == std::get<1>(_number_of_values)) {
          oss << std::get<0>(_number_of_values);
        } else {
          oss << "[" << std::get<0>(_number_of_values) << ", " << std::get<1>(_number_of_values) << "]";
        }
        oss << " values, actual has " << _actual.size() << " values ";
        if (std::get<0>(_number_of_values) > _actual.size()) {
          oss << "(too few)";
        }
        if (_actual.size() > std::get<1>(_number_of_values)) {
          oss << "(too many)";
        }
        oss << ".";
        oss << " The values are:";
        for (const auto &v : _actual) {
          oss << v << ", ";
        }
        _error_messages.push_back(oss.str());
        _error_messages.back().pop_back();
        _error_messages.back().back() = '.';

        return false;
      }
      return true;
    }

    bool must() const { return _required; }

    const std::string &name() const { return _name; }

    char short_name() const { return _short_name; }

    const std::string &description() const { return _description; }

    const std::string error_message() const {
      // always return the latest error message
      if (_error_messages.empty()) {
        return ""s;
      }
      return _error_messages.back();
    }

    std::string short_description() const { return "--" + _name + "=" + detail::readable_typename<T>() + "[]"; }

   protected:
    virtual T read(const std::string &s) = 0;

    std::vector<std::string> _error_messages;

   private:
    const std::string _name;
    const char _short_name;
    const bool _required;
    const std::string _description;
    const num_of_values_t _number_of_values;  // [minimum, maximum)

    bool _has;
    const std::vector<T> _default;
    std::vector<T> _actual;
  };

  template <class T, class F>
  class option_with_multiple_value_with_reader : public option_with_multiple_value<T> {
   public:
    option_with_multiple_value_with_reader(const std::string &full_name, char short_name, bool is_needed,
                                           const std::vector<T> &default_value, const std::string &description, const F &value_reader,
                                           const num_of_values_t &number_of_values = DEFAULT_NUM_OF_VALUES)
        : option_with_multiple_value<T>(full_name, short_name, is_needed, default_value,
                                        full_description(description, is_needed, default_value, number_of_values, value_reader),
                                        number_of_values),
          _reader(value_reader) {}
    ~option_with_multiple_value_with_reader() {}

   private:
    /**
     * @format "<description> (<type>[] [=[<each>, <default>, <element>]], expect min <lb> max <hb> values, with each must be <restriction
     * text>.)"
     * @format "<description> (<type>[] [=[<each>, <default>, <element>]], expect <lb=hb> values, with each must be <restriction text>.)"
     */
    static std::string full_description(const std::string &description, bool required, const std::vector<T> &default_value,
                                        const num_of_values_t &num_of_values, const F &reader) {
      std::ostringstream oss;
      oss << description << " (" << detail::readable_typename<T>() << "[]";
      if (!required) {
        oss << " [=[";
        if (!default_value.empty()) {
          oss << default_value.front();
          for (size_t i = 1; i < default_value.size(); ++i) {
            oss << ", " << default_value[i];
          }
        }
        oss << "]";
      }
      if (num_of_values != DEFAULT_NUM_OF_VALUES) {
        if (std::get<0>(num_of_values) == std::get<1>(num_of_values)) {
          oss << ", expect " << std::get<0>(num_of_values) << " values";
        } else {
          oss << ", expect min " << std::get<0>(num_of_values) << " max " << std::get<1>(num_of_values) << " values";
        }
      }
      const std::string restriction_text = reader.restriction_text();
      if (!restriction_text.empty()) {
        oss << ", with each element must be " << restriction_text;
      }
      oss << ")";

      return oss.str();
    }

    T read(const std::string &s) {
      try {
        return _reader(s);
      } catch (const cmdline::cmdline_error &e) {
        this->_error_messages.push_back(""s + e.what() + ". Value must be " + _reader.restriction_text() + "."s);
        throw;
      }
    }

    const F _reader;
  };

  std::map<std::string, std::shared_ptr<option_base>> options;
  std::vector<std::shared_ptr<option_base>> ordered;
  std::string ftr;

  bool provided_program_name;
  std::string prog_name;
  std::vector<std::string> others;

  std::vector<std::string> errors;
};

}  // namespace cmdline
