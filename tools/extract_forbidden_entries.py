#!/usr/bin/env python3
import os
import shutil
import sys

FORBIDDEN_TXT = [
    "01-1863-Calamity.txt",
    "02-1864-Centralia.txt",
    "03-1873-TrainRobbery.txt",
    "04-1876-RIPJamesBros.txt",
    "05-1881-Crocker.txt",
    "06-1889-Skaianet.txt",
    "07-1895-Einstein.txt",
    "08-1896-FredKarnosArmy.txt",
    "09-1903-PatentOffice.txt",
    "10-1910-JaneAndJake.txt",
    "11-1923-JakeLeaves.txt",
    "12-1926-RIPHoudini.txt",
    "13-1927-PuttingPantsOnPhilip.txt",
    "14-1931-JakeReturns.txt",
    "15-1933-HitlersPromotion.txt",
    "16-1942-AnnDunham.txt",
    "17-1945-WWII.txt",
    "18-1955-RIPEinstein.txt",
    "19-1957-RIPHardy.txt",
    "20-1961-NextPhase.txt",
    "21-1964-TheFieriClones.txt",
    "22-1965-LaurelsLastStand.txt",
    "23-1965-2009-SkipToTheEnd.txt",
    "24-1863-1965-PostScratchTimeline.txt",
    "25-1965-HarryAdoptsFieriAgain.txt",
    "26-1977-ChaplinsLastStand.txt",
    "27-1989-ICP.txt",
    "28-1996-JaneAndJake.txt",
    "29-2008-Obama.txt",
    "30-2011-Rebranding.txt",
    "31-2016-Trump.txt",
    "32-2024-TheDoubleJuggaloPresidency.txt",
    "33-2029-Apophis.txt",
    "34-2050-Flooding.txt",
    "35-2040-2424-PreparingAlterniaC.txt",
    "36-RIPHIC.txt"
]

def main():
    if len(sys.argv) < 2:
        print("Usage: extract_forbidden_entries.py <ASSET_DIR>")
        sys.exit(1)
    asset_dir = sys.argv[1]
    src_dir = os.path.join(asset_dir, "archive", "skaianet", "FORBIDDEN_ENTRIES")
    dest_dir = os.path.join("src", "data", "forbidden_entries")
    os.makedirs(dest_dir, exist_ok=True)
    for fname in FORBIDDEN_TXT:
        src_path = os.path.join(src_dir, fname)
        dest_path = os.path.join(dest_dir, fname)
        if not os.path.exists(src_path):
            print(f"Warning: {src_path} does not exist.")
            continue
        shutil.copy2(src_path, dest_path)
        print(f"Copied {src_path} -> {dest_path}")

if __name__ == "__main__":
    main()