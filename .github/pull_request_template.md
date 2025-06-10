<!-- Please only keep sections that are relevant. --> 

## Summary
<!-- Is this a bug fixing or feature --->
<!--- e.g. Bug fix #1234 -->
<!--- e.g. New feature - Added TA for xxxx -->

## Description
<!-- For each section, please include both changes to client and server, if you made changes to them. -->

### Motivation and Context
<!--- Why is this change required? What problem does it solve? -->

### Screenshots
<!-- Keep this section only when there's any UI change to the client / web page. -->

### Functionality Changes
<!-- Keep this section only when there's any feature change. Focus on UX change / big UI change. -->

### API Changes
<!-- Keep this section when necessary. -->

### Changes to Deployment
<!-- Please update accordingly. We shall update this when we have a proper backend server. For example: -->

```sh
cd client
npm install
npm run build
npm run start
```

### Changes to Dependencies
<!-- Please list newly added dependencies and state the reason. Also highlight removed dependencies & upgrades. -->

```diff
+ "@headlessui/react": "^2.2.4"  # UI template, maintained by Tailwind CSS, MIT License https://github.com/tailwindlabs/headlessui
+ "lucide-react": "^0.513.0"  # SVG icons, MIT License https://lucide.dev/guide/
- "@tailwindcss/postcss": "^4"
+ "@tailwindcss/postcss": "^4.1.8"  # upgrade to a newer version, automatic bump
```

### Misc.
<!-- Other parts you want to highlight -->

## How to run / test
<!-- Commands to run / test changes in your PR. For example, command to start a test server for frontend. Please update accordingly -->

```sh
cd client
npm install
npm run build
npm run start
```
