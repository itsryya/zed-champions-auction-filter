// ==UserScript==
// @name         Zed Champions Auction NO Price Yet Filters
// @namespace    http://tampermonkey.net/
// @version      1.10
// @description  Star + Bloodline + Win Rate + Color + Price filtering on Zed Champions Auctions
// @match        https://app.zedchampions.com/auctions
// @author       Ryya
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const bloodlines = ['NAKAMOTO', 'SZABO', 'FINNEY', 'BUTERIN'];
    const starRatings = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    const colors = {
        '#ef9a9a': 'Sea Pink',
        '#e57373': 'Sunglo',
        '#ef5350': 'Burnt Sienna',
        '#f44336': 'Pomegranate',
        '#e53935': 'Cinnabar',
        '#d32f2f': 'Alizarin Crimson',
        '#f48fb1': 'Mauvelous',
        '#f06292': 'Froly',
        '#ec407a': 'French Rose',
        '#e91e63': 'Amaranth',
        '#d81b60': 'Maroon Flush',
        '#c2185b': 'Jazzberry Jam',
        '#ff1744': 'Torch Red',
        '#f50057': 'Razzmatazz',
        '#d50000': 'Guardsman Red',
        '#000000': 'Black',
        '#81d4fa': 'Malibu',
        '#4fc3f7': 'Jordy Blue',
        '#29b6f6': 'Dodger Blue',
        '#03a9f4': 'Cerulean',
        '#039be5': 'Curious Blue',
        '#0288d1': 'Lochmara',
        '#80deea': 'Spray',
        '#4dd0e1': 'Turquoise Blue',
        '#26c6da': 'Scooter',
        '#00bcd4': 'Robin’s Egg Blue',
        '#00acc1': 'Pacific Blue',
        '#0097a7': 'Bondi Blue',
        '#18ffff': 'Aqua',
        '#00e5ff': 'Cyan',
        '#2962ff': 'Wild Blue Yonder',
        '#757575': 'Boulder',
        '#ce93d8': 'Light Wisteria',
        '#ba68c8': 'Amethyst',
        '#ab47bc': 'Mamba',
        '#9c27b0': 'Seance',
        '#8e24aa': 'Purple Heart',
        '#7b1fa2': 'Eminence',
        '#b39ddb': 'Lavender',
        '#9575cd': 'Lilac Bush',
        '#7e57c2': 'Fuchsia',
        '#673ab7': 'Mischka',
        '#5e35b1': 'Manatee',
        '#512da8': 'Daisy Bush',
        '#e040fb': 'Heliotrope',
        '#7c4dff': 'Prelude',
        '#aa00ff': 'Electric Violet',
        '#ffffff': 'White',
        '#fffde7': 'Picasso',
        '#fff9c4': 'Paris Daisy',
        '#fff176': 'Gorse',
        '#fdd835': 'Astra',
        '#fbc02d': 'Bright Sun',
        '#f9a825': 'Lightning Yellow',
        '#e6ee9c': 'Primrose',
        '#dce775': 'Manz',
        '#d4e157': 'Wattle',
        '#cddc39': 'Pear',
        '#c0ca33': 'Earls',
        '#afb42b': 'Ginger',
        '#c6ff00': 'Electric Lime',
        '#ffff00': 'Shalimar',
        '#ffcd00': 'Golf',
        '#bdbdbd': 'Silver'
    };
    const REFRESH_INTERVAL = 1000;
    const DEBOUNCE_TIME = 300;

    let starFilters = [], bloodlineFilters = [], colorFilter = null, sortTimeAsc = false, winrateFilter = null, noPriceFilter = false, lowPriceFilter = false;
    let debounceTimer, statusBox;

    const $ = (s, p = document) => p.querySelector(s);
    const $$ = (s, p = document) => [...p.querySelectorAll(s)];

    function getStarRating(card) {
        const container = card.querySelector('.css-k008qs, [class*="star-rating"]');
        if (!container) return 0;
        const starElements = container.querySelectorAll('*');
        let rating = 0;
        if (starElements.length > 0) {
            const ratingText = container.textContent.trim();
            if (ratingText.match(/^[\d\.]+$/)) return parseFloat(ratingText);
            else if (ratingText.includes('★')) {
                const stars = (ratingText.match(/★/g) || []).length;
                const hasHalf = ratingText.includes('½') || (ratingText.includes('☆') && stars > 0);
                return stars + (hasHalf ? 0.5 : 0);
            } else {
                let fullStars = 0, hasHalfStar = false;
                const oldStarElements = container.querySelectorAll('.css-1o988h9');
                oldStarElements.forEach(starElement => {
                    if (starElement.querySelector('.css-1tt5dvj')) fullStars++;
                    else if (starElement.querySelector('.css-139eomv')) hasHalfStar = true;
                });
                return fullStars + (hasHalfStar ? 0.5 : 0);
            }
        }
        return 0;
    }

    function getBloodline(card) {
        const text = card.textContent.toUpperCase();
        return bloodlines.find(b => text.includes(b)) || null;
    }

    function getColor(card) {
        const colorLayer = card.querySelector('div[style*="mask-image"][style*="background-color"]');
        if (!colorLayer) return null;
        const bg = colorLayer.style.backgroundColor;
        const match = bg.match(/rgb\((\d+), (\d+), (\d+)\)/);
        if (!match) return null;
        const [_, r, g, b] = match.map(Number);
        const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
        return hex.toLowerCase();
    }

    function getTimeRemaining(card) {
        const el = card.querySelector('.css-1baulvz, [class*="time-remaining"]');
        if (!el) return Infinity;
        const t = el.textContent;
        const days = (t.match(/(\d+)d/) || [0, 0])[1];
        const hours = (t.match(/(\d+)h/) || [0, 0])[1];
        const mins = (t.match(/(\d+)m/) || [0, 0])[1];
        const secs = (t.match(/(\d+)s/) || [0, 0])[1];
        return (+days * 86400) + (+hours * 3600) + (+mins * 60) + (+secs);
    }

    function getWinRate(card) {
        const statsRow = card.querySelector('div.css-kfnzmt');
        if (!statsRow) {
            console.log('Stats row NOT found in card:', card);
            return null;
        }
        const statDivs = statsRow.querySelectorAll('div[class*="css-1ktp5rg"]');
        if (statDivs.length < 3) {
            console.log('Not enough stat divs found in row:', statDivs.length, 'Card:', card);
            return null;
        }
        const winrateDiv = statDivs[2];
        const el = winrateDiv.querySelector('svg.chakra-icon.css-ztrd3n[viewBox="0 0 16 16"] + p.chakra-text.css-1bqkjs6') ||
                   winrateDiv.querySelector('svg[class*="chakra-icon"][class*="css-"][viewBox="0 0 16 16"] + p[class*="chakra-text"][class*="css-"]');
        if (el) {
            const winRateText = el.textContent.trim();
            console.log('Winrate element found:', el, 'Text:', winRateText, 'Card:', card);
            if (/^\d+$/.test(winRateText)) {
                const winRate = parseInt(winRateText, 10);
                return isNaN(winRate) ? null : winRate;
            }
        }
        console.log('Winrate element NOT found in third stat div:', winrateDiv, 'Card:', card);
        return null;
    }

    function hasPriceBox(card) {
        const priceBox = card.querySelector('p.chakra-text.css-y7l7nr');
        return !!priceBox; // Returns true if the price box exists, false if not
    }

    function getPrice(card) {
        const priceBox = card.querySelector('p.chakra-text.css-y7l7nr');
        if (!priceBox) return null;
        const priceElement = priceBox.querySelector('span.chakra-text.css-12v5hzn');
        if (!priceElement) return null;
        const priceText = priceElement.textContent.trim();
        const price = parseInt(priceText, 10);
        return isNaN(price) ? null : price;
    }

    function updateStatus() {
        const cards = $$('.css-4k37cb, [class*="auction-card"]');
        const total = cards.length;
        const visible = cards.filter(c => !c.classList.contains('zed-card-hidden')).length;
        statusBox.textContent = `${visible}/${total} AUCTIONS`;
    }

    function debounce(fn) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fn, DEBOUNCE_TIME);
    }

    function filterAndSort() {
        const cards = $$('.css-4k37cb, [class*="auction-card"]');
        const container = $('#auctionlist-container') || $('main');

        cards.forEach(card => {
            const stars = getStarRating(card);
            const blood = getBloodline(card);
            const color = getColor(card);
            const winrate = getWinRate(card);
            const hasPrice = hasPriceBox(card);
            const price = getPrice(card);

            const starMatch = !starFilters.length || starFilters.some(filter => filter.toFixed(1) === stars.toFixed(1));
            const bloodMatch = !bloodlineFilters.length || (blood && bloodlineFilters.includes(blood));
            const colorMatch = !colorFilter || (color && color === colorFilter);
            const winrateMatch = winrateFilter === null || (winrate !== null && winrate >= winrateFilter);
            let priceMatch = true;

            if (noPriceFilter) {
                priceMatch = !hasPrice; // If "No Price" is checked, only match cards without a price
            } else if (lowPriceFilter) {
                priceMatch = hasPrice && price !== null && price < 1000; // If "Price < 1000 ZED" is checked, match cards with price < 1000
            }

            card.classList.toggle('zed-card-hidden', !(starMatch && bloodMatch && colorMatch && winrateMatch && priceMatch));
        });

        if (sortTimeAsc && container) {
            const visibleCards = cards.filter(c => !c.classList.contains('zed-card-hidden'));
            visibleCards.sort((a, b) => getTimeRemaining(a) - getTimeRemaining(b)).forEach(c => container.appendChild(c));
        }

        updateStatus();
    }

    function toggleFilter(type, value, btn) {
        if (type === 'star') {
            const numericValue = parseFloat(value);
            const idx = starFilters.findIndex(s => s.toFixed(1) === numericValue.toFixed(1));
            if (idx >= 0) {
                starFilters.splice(idx, 1);
                btn.classList.remove('active');
            } else {
                starFilters.push(numericValue);
                btn.classList.add('active');
            }
        } else if (type === 'bloodline') {
            const idx = bloodlineFilters.indexOf(value);
            if (idx >= 0) {
                bloodlineFilters.splice(idx, 1);
                btn.classList.remove('active');
            } else {
                bloodlineFilters.push(value);
                btn.classList.add('active');
            }
        } else if (type === 'color') {
            if (colorFilter === value) {
                colorFilter = null;
                btn.classList.remove('active');
            } else {
                colorFilter = value;
                [...btn.parentElement.children].forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        }
        debounce(filterAndSort);
    }

    const style = `
    .zed-filter-container {
        position: sticky;
        top: 0;
        z-index: 9999;
        background: #000000;
        color: white;
        display: flex;
        flex-wrap: wrap;
        gap: 10px 20px;
        padding: 12px 20px;
        padding-left: 32px;
        border-bottom: 1px solid #2D3748;
    }
    .zed-filter-group {
        font-weight: bold;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .zed-filter-btn {
        background: #293133;
        color: gray;
        font-weight: bold;
        padding: 6px 10px;
        border: none;
        border-radius: 0px;
        cursor: pointer;
        font-size: 13px;
        min-width: 40px;
        text-align: center;
        margin-right: 6px;
        margin-bottom: 6px;
    }
    .zed-filter-btn.active {
        background: linear-gradient(to right,
            #9ce09b 0%,
            #9ce09b 20%,
            #74c9d4 45%,
            #6abfd9 55%,
            #5fc9d4 70%,
            #6abfd9 100%);
        color: black;
        font-weight: bold;
    }
    .zed-status-box {
        background: #293133;
        color: gray;
        padding: 6px 10px;
        border-radius: 0;
        font-size: 13px;
        font-weight: bold;
        min-width: 160px;
        text-align: center;
        height: 32px;
        display: flex;
        align-items: center;
        margin: 0;
        box-sizing: border-box;
    }
    .zed-card-hidden {
        display: none !important;
    }
    .zed-dropdown {
        background: #293133;
        color: gray;
        font-weight: bold;
        padding: 6px 10px;
        border: none;
        border-radius: 0px;
        cursor: pointer;
        font-size: 13px;
        min-width: 60px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        position: relative;
    }
    .zed-dropdown-menu {
        position: absolute;
        background: #293133;
        border: 1px solid #2D3748;
        display: none;
        flex-direction: column;
        gap: 6px;
        padding: 6px 10px;
        z-index: 999;
        max-height: 300px;
        overflow-y: auto;
        top: 100%;
        left: 0;
    }
    .zed-dropdown-menu .zed-filter-btn {
        color: white;
    }
    .zed-dropdown-menu .zed-filter-btn.invert-text {
        color: black;
    }
    .zed-dropdown-menu .zed-filter-btn.active {
        background: linear-gradient(to right,
            #9ce09b 0%,
            #9ce09b 20%,
            #74c9d4 45%,
            #6abfd9 55%,
            #5fc9d4 70%,
            #6abfd9 100%);
        color: black !important;
    }
    .zed-dropdown.open .zed-dropdown-menu {
        display: flex;
    }
    .zed-checkbox-group {
        display: flex;
        flex-direction: column; /* Stack checkboxes vertically */
        gap: 4px; /* Reduced gap for tighter stacking */
        margin-bottom: 6px;
    }
    .zed-checkbox-group .checkbox-row {
        display: flex;
        align-items: center;
        gap: 4px; /* Reduced gap for tighter layout */
    }
    .zed-checkbox-group label {
        font-size: 11px; /* Reduced font size to fit better */
        font-weight: bold;
        color: white;
    }
    .zed-checkbox-group input[type="checkbox"] {
        cursor: pointer;
        width: 12px; /* Reduced size */
        height: 12px; /* Reduced size */
        accent-color: #74c9d4; /* Match the active gradient color */
    }
    `;

    function createUI() {
        const container = document.createElement('div');
        container.className = 'zed-filter-container';

        const makeGroup = (label, options, type) => {
            const group = document.createElement('div');
            group.className = 'zed-filter-group';
            group.innerHTML = `<label>${label}</label>`;
            const btns = document.createElement('div');
            for (const [key, name] of Object.entries(options)) {
                const btn = document.createElement('button');
                btn.className = 'zed-filter-btn';
                btn.textContent = name;
                btn.addEventListener('click', () => toggleFilter(type, key, btn));
                btns.appendChild(btn);
            }
            group.appendChild(btns);
            return group;
        };

        container.appendChild(makeGroup('Bloodline', Object.fromEntries(bloodlines.map(b => [b, b])), 'bloodline'));
        container.appendChild(makeGroup('Star Rating', Object.fromEntries(starRatings.map(s => [s.toFixed(1), s.toFixed(1)])), 'star'));

        // Color dropdown
        const colorGroup = document.createElement('div');
        colorGroup.className = 'zed-filter-group';
        colorGroup.innerHTML = `<label>Color</label>`;
        const colorDropdown = document.createElement('div');
        colorDropdown.className = 'zed-dropdown';
        colorDropdown.innerHTML = `SELECT COLOR <span>▼</span>`; // Down arrow symbol
        const colorMenu = document.createElement('div');
        colorMenu.className = 'zed-dropdown-menu';

        for (const [key, name] of Object.entries(colors)) {
            const colorItem = document.createElement('button');
            colorItem.className = 'zed-filter-btn';
            colorItem.textContent = name;
            colorItem.style.backgroundColor = key;
            const invertColors = [
                'aqua', 'cyan', 'white', 'picasso', 'paris daisy', 'gorse', 'astra', 'primrose',
                'manz', 'wattle', 'pear', 'electric lime', 'shalimar'
            ];
            if (invertColors.includes(name.toLowerCase())) {
                colorItem.classList.add('invert-text');
            }
            colorItem.addEventListener('click', () => {
                toggleFilter('color', key, colorItem);
                colorDropdown.classList.remove('open');
            });
            colorMenu.appendChild(colorItem);
        }

        colorDropdown.appendChild(colorMenu);
        colorDropdown.addEventListener('click', () => {
            colorDropdown.classList.toggle('open');
        });

        colorGroup.appendChild(colorDropdown);
        container.appendChild(colorGroup);

        // Winrate dropdown
        const winrateGroup = document.createElement('div');
        winrateGroup.className = 'zed-filter-group';
        winrateGroup.innerHTML = `<label>Winrate</label>`;
        const winrateDropdown = document.createElement('div');
        winrateDropdown.className = 'zed-dropdown';
        winrateDropdown.innerHTML = `WINRATE <span>▼</span>`;
        const winrateMenu = document.createElement('div');
        winrateMenu.className = 'zed-dropdown-menu';

        [0, 5, 10, 15, 20, 25, 30].forEach(rate => {
            const btn = document.createElement('button');
            btn.className = 'zed-filter-btn';
            btn.textContent = `≥ ${rate}%`;
            btn.addEventListener('click', () => {
                if (winrateFilter === rate) {
                    winrateFilter = null;
                    btn.classList.remove('active');
                } else {
                    winrateFilter = rate;
                    [...winrateMenu.children].forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
                winrateDropdown.classList.remove('open');
                debounce(filterAndSort);
            });
            winrateMenu.appendChild(btn);
        });
        winrateDropdown.appendChild(winrateMenu);
        winrateDropdown.addEventListener('click', () => {
            winrateDropdown.classList.toggle('open');
        });
        winrateGroup.appendChild(winrateDropdown);
        container.appendChild(winrateGroup);

        // Price Filters (Checkboxes)
        const priceGroup = document.createElement('div');
        priceGroup.className = 'zed-filter-group';
        priceGroup.innerHTML = `<label>Price</label>`;
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'zed-checkbox-group';

        // No Price Checkbox
        const noPriceRow = document.createElement('div');
        noPriceRow.className = 'checkbox-row';
        const noPriceCheckbox = document.createElement('input');
        noPriceCheckbox.type = 'checkbox';
        noPriceCheckbox.id = 'no-price-filter';
        noPriceCheckbox.addEventListener('change', () => {
            noPriceFilter = noPriceCheckbox.checked;
            if (noPriceFilter) {
                // If "No Price" is checked, uncheck "Price < 1000 ZED" since they are mutually exclusive
                lowPriceCheckbox.checked = false;
                lowPriceFilter = false;
            }
            debounce(filterAndSort);
        });
        const noPriceLabel = document.createElement('label');
        noPriceLabel.htmlFor = 'no-price-filter';
        noPriceLabel.textContent = 'No Price';
        noPriceRow.appendChild(noPriceCheckbox);
        noPriceRow.appendChild(noPriceLabel);
        checkboxContainer.appendChild(noPriceRow);

        // Price < 1000 ZED Checkbox
        const lowPriceRow = document.createElement('div');
        lowPriceRow.className = 'checkbox-row';
        const lowPriceCheckbox = document.createElement('input');
        lowPriceCheckbox.type = 'checkbox';
        lowPriceCheckbox.id = 'low-price-filter';
        lowPriceCheckbox.addEventListener('change', () => {
            lowPriceFilter = lowPriceCheckbox.checked;
            if (lowPriceFilter) {
                // If "Price < 1000 ZED" is checked, uncheck "No Price" since they are mutually exclusive
                noPriceCheckbox.checked = false;
                noPriceFilter = false;
            }
            debounce(filterAndSort);
        });
        const lowPriceLabel = document.createElement('label');
        lowPriceLabel.htmlFor = 'low-price-filter';
        lowPriceLabel.textContent = 'Price < 1000 ZED';
        lowPriceRow.appendChild(lowPriceCheckbox);
        lowPriceRow.appendChild(lowPriceLabel);
        checkboxContainer.appendChild(lowPriceRow);

        priceGroup.appendChild(checkboxContainer);
        container.appendChild(priceGroup);

        // Sort by Time
        const sortGroup = document.createElement('div');
        sortGroup.className = 'zed-filter-group';
        sortGroup.innerHTML = `<label>Sort</label>`;
        const sortBtn = document.createElement('button');
        sortBtn.className = 'zed-filter-btn';
        sortBtn.textContent = 'SORT BY TIME';
        sortBtn.addEventListener('click', () => {
            sortTimeAsc = !sortTimeAsc;
            sortBtn.classList.toggle('active', sortTimeAsc);
            filterAndSort();
        });
        sortGroup.appendChild(sortBtn);
        container.appendChild(sortGroup);

        // Status Box
        const statusGroup = document.createElement('div');
        statusGroup.className = 'zed-filter-group';
        statusGroup.innerHTML = `<label>Status</label>`;
        statusBox = document.createElement('div');
        statusBox.className = 'zed-status-box';
        statusGroup.appendChild(statusBox);
        container.appendChild(statusGroup);

        const target = document.querySelector('main') || document.body;
        target.prepend(container);
    }

    function init() {
        if (!window.location.href.includes('zedchampions.com/auctions')) return;
        document.head.insertAdjacentHTML('beforeend', `<style>${style}</style>`);
        createUI();
        new MutationObserver(() => debounce(filterAndSort)).observe(document.body, { childList: true, subtree: true });
        filterAndSort();
        setInterval(() => debounce(filterAndSort), REFRESH_INTERVAL);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();