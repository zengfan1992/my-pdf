deno run --allow-all build.ts
# Get the current version from package.json
current_version=$(jq -r '.version' build/package.json)
# Split the version into an array
IFS='.' read -r -a version_parts <<< "$current_version"
# Increment the patch version (last number)
((version_parts[2]++))
# Join the version parts back into a string
new_version="${version_parts[0]}.${version_parts[1]}.${version_parts[2]}"
# Update the version in package.json
jq ".version = \"$new_version\"" build/package.json > tmp.json && mv tmp.json build/package.json
# echo "Version updated to $new_version"
echo "Version updated to $new_version"
# build
cd build && zip -r ~/shared/my-pdf.zip . && cd ..