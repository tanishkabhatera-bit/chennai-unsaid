# Articles

One news article per `.txt` file, e.g. `2023-12-06-thehindu-velachery.txt`. Each file starts with four header lines, then a line with only `---`, then the article text copied from the page:

```
URL: https://www.thehindu.com/...
TITLE: Water yet to recede in parts of Velachery
OUTLET: The Hindu
PUBLISHED: 2023-12-06
---
(paste the article text here)
```

Then run `npm run extract`. Each article becomes `data/extracted/<file name>.json`, and all records are combined into `data/flood-records.json`. Check a sample against the articles by hand.
