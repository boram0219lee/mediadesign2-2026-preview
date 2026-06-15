Creatures of Sense — final layout based on Google Sheet

Included works: 19

Files:
- index.html
- work.html
- data.js
- student_upload_map.csv
- works/
- thumbnails/

Detailed page layout:
1. Title
2. Student name
3. Sense origin
4. Description
5. Viewer meta line above canvas:
   input device · input action · output
6. Canvas / p5.js iframe
7. Interaction / Output guide

Current data.js uses p5.js links from the Google Sheet when available.
When student zip files are ready:
1. Unzip each student's export zip.
2. Place it in works/s학번/.
3. Upload thumbnail as thumbnails/s학번.jpg.
4. In data.js, change each item:
   displayMode: "local"
   link: "works/s학번/index.html"

If a webcam, guitar, Arduino, or permission-sensitive work is unstable in iframe:
- use displayMode: "external"
