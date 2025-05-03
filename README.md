# Zed Champions Auction Filters + Sorting

## Overview
This [Tampermonkey](https://www.tampermonkey.net/) userscript enhances the [Zed Champions auction page](https://app.zedchampions.com/auctions) by adding filtering and sorting capabilities. Filter auctions by **bloodline**, **star rating**, **winrate**, **color**,  and sort by time remaining. The script adds a sticky filter bar at the top of the page for easy access to these features.

## Features
- **Bloodline Filter**: Filter by bloodlines (Nakamoto, Szabo, Finney, Buterin).
- **Star Rating Filter**: Filter auctions by star ratings (1 to 5, in 0.5 increments).
- **Winrate Filter**: Filter by minimum winrate percentage (e.g., ≥ 0%, ≥ 5%) using a dropdown menu.
- **Color Filter**: Filter by a wide range of colors (e.g., Sea Pink, Pomegranate, Dodger Blue) using a dropdown menu.
- **Sort by Time**: Sort auctions by time remaining (ascending order).
- **Status Display**: Shows the number of visible auctions out of the total (e.g., "10/50 AUCTIONS").

### Screenshots
![Auction Filter Preview 1](https://raw.githubusercontent.com/itsryya/zed-champions-auction-filter/main/auctionfilter-preview-1.png)

![Auction Filter Preview 2](https://raw.githubusercontent.com/itsryya/zed-champions-auction-filter/main/auctionfilter-preview-2.png)


## Installation
1. **Install Tampermonkey**:
   - Install the Tampermonkey extension for your browser:
     - [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
     - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
     - [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
     - [Safari](https://apps.apple.com/us/app/tampermonkey/id1482490089)
2. **Add the Script**:
   - Click the Tampermonkey icon in your browser and select "Create a new script."
   - Copy and paste the entire script code into the editor.
   - Save the script (`Ctrl+S` or `Cmd+S`).
3. **Visit the Auction Page**:
   - Go to [https://app.zedchampions.com/auctions](https://app.zedchampions.com/auctions).
   - The script will automatically load and display the filter bar at the top of the page.

## Usage Instructions
To get the best experience and ensure all auctions are loaded for filtering, follow these steps:

1. **Start the Automatic Load of All Auctions**:
   - When you first load the auction page, select the **5-star rating** filter by clicking the "5" button under the "Star Rating" section in the filter bar.
   - This triggers the page to automatically load all available auctions (the site may use lazy loading, so this ensures all data is fetched).
   - Wait a few seconds for the auctions to load fully.

2. **Deselect the 5-Star Filter to See All Auctions**:
   - Click the "5" button again to deselect the 5-star filter.
   - This will display all auctions on the page, now that they’ve been loaded.

3. **Make Your Specific Selections**:
   - Use the filter bar to apply your desired filters:
     - **Star Rating**: Click the star ratings you want to filter by (e.g., "3", "4.5"). Click again to deselect.
     - **Bloodline**: Click the bloodlines to filter (e.g., "Nakamoto", "Szabo"). Click again to deselect.
     - **Color**: Click the "SELECT COLOR" dropdown, then choose a color (e.g., "Dodger Blue"). Click the same color to clear the filter.
     - **Winrate**: Click the "WINRATE" dropdown, then select a minimum winrate (e.g., "≥ 5%"). Click the same option to clear the filter.
     - **Sort by Time**: Click "SORT BY TIME" to sort auctions by time remaining (ascending). Click again to disable sorting.
   - The status bar (e.g., "10/50 AUCTIONS") will update to show how many auctions match your filters.

## Notes
- The script uses a 1-second refresh interval to update the filters as new auctions load. If you notice delays, you can increase the `REFRESH_INTERVAL` value in the script (e.g., to `2000` for 2 seconds).
- The filter bar is sticky and stays at the top of the page for easy access.
- Some colors (e.g., Aqua, White) have inverted text for better readability in the dropdown.

## Troubleshooting
- **No Filters Appear**:
  - Ensure you’re on the correct page ([https://app.zedchampions.com/auctions](https://app.zedchampions.com/auctions)) and that Tampermonkey (+ developer mode in the extension) is enabled.
- **Auctions Not Loading**:
  - Follow the usage steps to select and deselect the 5-star rating to trigger the page’s lazy loading.
- **Winrate Filter Not Working**:
  - Ensure auctions have loaded fully, as winrate data may not be available until the page fetches all details.

## Version
- **1.8** (as of the script’s metadata)

## Author
Developed by Ryya for use on the Zed Champions auction platform. Feel free to modify the script for personal use.

## License
This script is provided as-is, with no warranty. Use at your own risk.
