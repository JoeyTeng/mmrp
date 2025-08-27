import urllib.request
import json
import pathlib
import zipfile

OUTPUT_DIR = pathlib.Path(__file__).resolve().parents[2] / "binaries"
BINARY_IDS: list[str] = [
    # "9f3f1d50d2a57344fca7845ca2225b09"  # simple-video-processor-app
]


def download_gist_files(binary_ids: list[str] = BINARY_IDS) -> pathlib.Path:
    for gist_id in binary_ids:
        api_url = f"https://api.github.com/gists/{gist_id}"

        try:
            # Fetch Gist metadata
            with urllib.request.urlopen(api_url) as response:
                gist_data = json.loads(response.read().decode())
        except Exception as e:
            raise Exception(f"Failed to fetch Gist data for ID {gist_id}: {e}")

        # Create the output directory if it doesn't exist
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        # Download each file in the Gist
        files = gist_data.get("files", {})
        if not files:
            raise Exception("No files found in the Gist.")

        for file_name, file_info in files.items():
            binary_dir = OUTPUT_DIR / file_name.replace(".zip", "")
            # Save the file to the output directory
            file_path: pathlib.Path = OUTPUT_DIR / file_name
            try:
                file_url = file_info["raw_url"]

                # Download the file content
                with urllib.request.urlopen(file_url) as file_response:
                    file_content = file_response.read()

                with open(file_path, "wb") as file:
                    file.write(file_content)

            except Exception as e:
                print(f"Error downloading {file_name}: {e}")
                continue

            if not zipfile.is_zipfile(file_path):
                continue

            try:
                with zipfile.ZipFile(file_path, "r") as zip_ref:
                    zip_ref.extractall(binary_dir)
                file_path.unlink(missing_ok=True)
            except zipfile.BadZipFile:
                raise Exception(f"File {file_name} is not a valid zip file.")

    print(f"Downloaded and extracted binaries to: {OUTPUT_DIR}")
    return OUTPUT_DIR
