#!/bin/bash

# shopt -s globstar  # Not needed and causes issues on some systems

# find "Asset Pack V2/" -iname "*.DELETE*" -delete

# Asset Pack v2 has to be transformed to work in the webapp

# The root folder containing "Asset Pack V2"
assetdirsroot="/Users/jennyleidig/Documents/Projects/unofficial-homestuck-collection-web/assets"

# The root address of the webserver hosting the files
# Use environment variable or default to localhost
: "${ASSET_PACK_HREF:=http://127.0.0.1:8413/}"

# Duplicate asset pack
copyPack() {

	rsync -ria "${assetdirsroot}/Asset Pack V2/" "${assetdirsroot}/AssetPackV2Lite/" \
		--exclude "mods" \
		--no-p --no-g --chmod=ugo=rwX

		# --exclude "tiby/*.mp3" \
		# --exclude "Booklet.pdf" \
		# --exclude "Squiddles_booklet.pdf" \
		# --exclude "Fly-CUDkBTYWtGk.mp4" \
		# --exclude "namcohigh/game" \
		# --exclude "GENFROGBOOKLETSMALL.pdf" \
		# --exclude "miracles.mp4" \
		# --exclude "advimgs" \
		# --exclude "storyfiles" \
		# --exclude "ryanquest" \
		# --delete-excluded

	# TODO: tbiy exclude rule does not work

}

# --exclude "comics/pxs/*/"

# Copy imods to WAP
copyImods() {
	rsync -ria "/Users/jennyleidig/Documents/Projects/unofficial-homestuck-collection-web/src/imods" "${assetdirsroot}/AssetPackV2Lite/archive/imods/"
}


fixOB() {

	for ob in 04106 08080 08120 scraps; do
		(
		mkdir -p "${assetdirsroot}/AssetPackV2Lite/storyfiles/hs2/$ob/"
		rsync -ria "${assetdirsroot}/Asset Pack V2/storyfiles/hs2/$ob/" "${assetdirsroot}/AssetPackV2Lite/storyfiles/hs2/$ob/"
		) &
	done
	for ob in 05305 05395 05260; do
		(
		mkdir -p "${assetdirsroot}/AssetPackV2Lite/storyfiles/hs2/$ob/"
		rsync -ria "${assetdirsroot}/Asset Pack V2/storyfiles/hs2/$ob/" "${assetdirsroot}/AssetPackV2Lite/storyfiles/hs2/$ob/"
		echo "Processing Openbound $ob files for URL replacement..."
		find "${assetdirsroot}/AssetPackV2Lite/storyfiles/hs2/$ob/" -type f \( -name "*.html" -o -name "*.xml" \) 2>/dev/null | while read -r file; do
			if [ -f "$file" ]; then
				echo "  Processing: $file"
				# Convert assets:// URLs to relative paths for local resources
				perl -i -pe "s|assets://storyfiles/hs2/$ob/|./|g" "$file"
				# Update other assets:// URLs to use configured asset server
				perl -i -pe "s|assets://|${ASSET_PACK_HREF}|g" "$file"
			fi
		done
		) &
	done
	wait
}

# copyMods() {
# 	mkdir -p "${assetdirsroot}/AssetPackV2Lite/mods/"

# 	# CHANGEME
# 	for dir in \
# 		"click.js" \
# 		; do
# 		rsync -rit "${assetdirsroot}/Asset Pack V2/mods/${dir}" "${assetdirsroot}/AssetPackV2Lite/mods/" --exclude ".git" --copy-links
# 	done
# }

postprocessMods() {
	echo "Processing mod files for webpack compatibility..."
	
	# Process imods files
	find "${assetdirsroot}/AssetPackV2Lite/archive/imods" -name "*.js" -o -name "mod.js" 2>/dev/null | while read -r modjs; do
		if [ -f "$modjs" ]; then
			echo "Processing $modjs"
			# Use perl instead of sed for better cross-platform compatibility
			perl -i -pe 's|api\.readJson\('"'"'([^'"'"']+)'"'"'\)|require('"'"'$1'"'"')|g' "$modjs"
			perl -i -pe 's|api\.readJson\("([^"]+)"\)|require("$1")|g' "$modjs"
			perl -i -pe 's|api\.readYaml\('"'"'([^'"'"']+)'"'"'\)|require('"'"'!yaml-loader!$1'"'"').default|g' "$modjs"
			perl -i -pe 's|api\.readYaml\("([^"]+)"\)|require("!yaml-loader!$1").default|g' "$modjs"
			perl -i -pe 's|api\.readFile\('"'"'([^'"'"']+)'"'"'\)|require('"'"'!raw-loader!$1'"'"').default|g' "$modjs"
			perl -i -pe 's|api\.readFile\("([^"]+)"\)|require("!raw-loader!$1").default|g' "$modjs"
			
			perl -i -pe 's|await api\.readJsonAsync\('"'"'([^'"'"']+)'"'"'\)|(await import('"'"'$1'"'"'))?.default|g' "$modjs"
			perl -i -pe 's|await api\.readJsonAsync\("([^"]+)"\)|(await import("$1"))?.default|g' "$modjs"
			perl -i -pe 's|await api\.readYamlAsync\('"'"'([^'"'"']+)'"'"'\)|(await import('"'"'!yaml-loader!$1'"'"')).default|g' "$modjs"
			perl -i -pe 's|await api\.readYamlAsync\("([^"]+)"\)|(await import("!yaml-loader!$1")).default|g' "$modjs"
			perl -i -pe 's|await api\.readFileAsync\('"'"'([^'"'"']+)'"'"'\)|(await import('"'"'!raw-loader!$1'"'"')).default|g' "$modjs"
			perl -i -pe 's|await api\.readFileAsync\("([^"]+)"\)|(await import("!raw-loader!$1")).default|g' "$modjs"
		fi
	done
	
	# Process regular mods files if they exist
	if [ -d "${assetdirsroot}/AssetPackV2Lite/mods" ]; then
		find "${assetdirsroot}/AssetPackV2Lite/mods" -name "*.js" -o -name "mod.js" 2>/dev/null | while read -r modjs; do
			if [ -f "$modjs" ]; then
				echo "Processing $modjs"
				perl -i -pe 's|api\.readJson\('"'"'([^'"'"']+)'"'"'\)|require('"'"'$1'"'"')|g' "$modjs"
				perl -i -pe 's|api\.readJson\("([^"]+)"\)|require("$1")|g' "$modjs"
				perl -i -pe 's|api\.readYaml\('"'"'([^'"'"']+)'"'"'\)|require('"'"'!yaml-loader!$1'"'"').default|g' "$modjs"
				perl -i -pe 's|api\.readYaml\("([^"]+)"\)|require("!yaml-loader!$1").default|g' "$modjs"
				perl -i -pe 's|api\.readFile\('"'"'([^'"'"']+)'"'"'\)|require('"'"'!raw-loader!$1'"'"').default|g' "$modjs"
				perl -i -pe 's|api\.readFile\("([^"]+)"\)|require("!raw-loader!$1").default|g' "$modjs"
				
				perl -i -pe 's|await api\.readJsonAsync\('"'"'([^'"'"']+)'"'"'\)|(await import('"'"'$1'"'"'))?.default|g' "$modjs"
				perl -i -pe 's|await api\.readJsonAsync\("([^"]+)"\)|(await import("$1"))?.default|g' "$modjs"
				perl -i -pe 's|await api\.readYamlAsync\('"'"'([^'"'"']+)'"'"'\)|(await import('"'"'!yaml-loader!$1'"'"')).default|g' "$modjs"
				perl -i -pe 's|await api\.readYamlAsync\("([^"]+)"\)|(await import("!yaml-loader!$1")).default|g' "$modjs"
				perl -i -pe 's|await api\.readFileAsync\('"'"'([^'"'"']+)'"'"'\)|(await import('"'"'!raw-loader!$1'"'"')).default|g' "$modjs"
				perl -i -pe 's|await api\.readFileAsync\("([^"]+)"\)|(await import("!raw-loader!$1")).default|g' "$modjs"
			fi
		done
	fi
	
	echo "Mod processing complete."
}

# exit

# Host asset pack resources on ASSET_PACK_HREF
# copyPcloud() {

# 	echo Synchronizing pCloud

# 	pCloudRoot="/cygdrive/p/Public Folder/AssetPackV2Lite"

# 	rsync -ria --delete-after --size-only "${assetdirsroot}/AssetPackV2Lite/" "$pCloudRoot/" \
# 		--delete-excluded \
# 		--exclude "data/plugins"

# }
# Manual rewrites

# for ob in 05260 05305 05395; do
# 	mkdir -p "$pCloudRoot/storyfiles/hs2/$ob/"
# 	cat "Asset Pack V2/storyfiles/hs2/$ob/$ob.html" \
# 	| sed "s|assets://|${ASSET_PACK_HREF}|g" > "$pCloudRoot/storyfiles/hs2/$ob/$ob.html"
# done

if [ "${BASH_SOURCE[0]}" -ef "$0" ]
then
	echo Building AssetPackV2Lite
	copyPack

	echo copyImods and fixOB and copyMods
	copyImods &
	fixOB &
	# copyMods &
	wait

	postprocessMods

	# echo copyPcloud
	# copyPcloud
fi
