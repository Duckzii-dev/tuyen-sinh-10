const base = "/tuyen-sinh-10/";

const links = [
  "css/variables.css",
  "css/layout.css",
  "css/components.css",
  "css/charts.css",
  "css/animations.css",
  "css/responsive.css"
];

function loadCSS() {
    links.forEach(href => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = base + href;
        document.head.appendChild(link);
    });
}

loadCSS();
