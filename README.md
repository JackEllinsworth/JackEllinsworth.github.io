# CV site

My CV as a single-page site. Plain HTML, CSS and a small bit of JavaScript, no build step and no frameworks.

## Structure

```
index.html        the page
css/style.css     all the styling, including dark/light themes and print
js/main.js        theme toggle, current-section highlight, copy button
fonts/            3270 font (subset) and its licence
```

## Running it

Open `index.html` in a browser. That's it.

## Notes

- Dark/light follows the system setting until you pick one with the toggle, then it's remembered in localStorage.
- Printing the page (Ctrl+P) gives a plain black and white paper version.
- The font is [3270](https://github.com/rbanffy/3270font), cut down to the characters the page needs. Licence is in `fonts/LICENSE.txt`.
