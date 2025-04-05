
if(document.contentType === "text/xml" || document.contentType === "application/xml"){
    // !== window.top means it's an iframe, so the xmlElement is simply the document.documentElement
    // otherwise, it means the xml is opened in the top window (not an iframe), and chrome hides raw xml in the div with id=webkit-xml-viewer-source-xml
    let xmlElement = (window.self !== window.top) ? document.documentElement : document.getElementById("webkit-xml-viewer-source-xml").children[0];

    // prepare new html doc that contains the rendered xml
    const newHtmlDoc = document.implementation.createHTMLDocument("XML Viewer");
    newHtmlDoc.body.innerHTML = "<div id='xml-tree-container'></div>";
    attachedRenderedXmlToHtmlDoc(xmlElement, newHtmlDoc);
    // replace the original xml doc with rendered html doc
    document.replaceChild(newHtmlDoc.documentElement, document.documentElement);
}





function renderXMLTree(xmlNode) {
    if (!xmlNode){
        const msg = "No xml node found.";
        console.error(msg);
        return msg;
    }

    let html = "<li>";

    // Check if the node is an ELEMENT node (e.g., <tag>)
    if (xmlNode.nodeType === Node.ELEMENT_NODE) {
        let hasChildren = xmlNode.children.length > 0;
        let hasText = xmlNode.textContent.trim().length > 0;
        let isEmpty = !hasChildren && !hasText;

        let toggleSymbol = hasChildren ? `<span class="toggle">+</span>` : "";
        let openingTag = `<span class="node-tag">&lt;${xmlNode.nodeName}&gt;</span>`;
        let closingTag = `<span class="node-tag">&lt;/${xmlNode.nodeName}&gt;</span>`;

        if (isEmpty) {
            // Self-closing tag for empty nodes
            html += `${toggleSymbol} <span class="node-tag">&lt;${xmlNode.nodeName} /&gt;</span>`;
        } else {
            // Standard open tag
            html += `${toggleSymbol} ${openingTag}`;

            if (hasChildren || hasText) {
                let collapsedClass = hasChildren ? "collapsed" : "";

                html += `<ul class="${collapsedClass}">`;

                // Add child elements and text content
                Array.from(xmlNode.childNodes).forEach(child => {
                    html += renderXMLTree(child);
                });

                html += `</ul>${closingTag}`;
            }
        }
    }
    // Handle TEXT nodes (text content inside elements)
    else if (xmlNode.nodeType === Node.TEXT_NODE) {
        // console.log(xmlNode.textContent);
        let text = xmlNode.textContent.trim();
        if (text.length > 0) {
            html += `<span class="text-content xyz">${text}</span>`;
        }
    }

    html += "</li>";
    return html;
}


// hook rendered-xml html to a html document, and add event listener for clicks
function attachedRenderedXmlToHtmlDoc(xmlDocument, htmlDoc) {
    const container = htmlDoc.getElementById("xml-tree-container");
    if (!container){
        console.error("xml-tree-container not found");
        return;
    }

    // Generate the tree HTML
    container.innerHTML = `<ul id="root-node">${renderXMLTree(xmlDocument)}</ul>`;

    addDarkModeButton(htmlDoc, container);
    addFoldUnfoldButton(htmlDoc, container);


    // Add event listener to all toggle buttons
    container.querySelectorAll(".toggle").forEach(toggle => {
        toggle.addEventListener("click", function () {
            let sublist = this.parentNode.querySelector("ul");
            if (sublist) {
                sublist.classList.toggle("collapsed");
                this.textContent = sublist.classList.contains("collapsed") ? "+" : "-";
            }
        });
    });

    container.querySelectorAll("#xml-tree-container .node-tag").forEach(nodeTag => {
        nodeTag.addEventListener("click", function () {
            let sublist = this.parentNode.querySelector("ul");
            // const oldTextContent = this.textContent;
            if (sublist) {
                sublist.classList.toggle("collapsed");
                this.previousElementSibling.textContent = sublist.classList.contains("collapsed") ? "+" : "-";
            }
        });
    });
}

function addDarkModeButton(htmlDoc, container) {
    const toggleBtn = htmlDoc.createElement("button");
    toggleBtn.textContent = "Toggle Dark Mode";
    toggleBtn.style.cssText = "position: fixed; top: 10px; right: 100px; z-index: 9999; padding: 5px 10px;";
    htmlDoc.body.appendChild(toggleBtn);

    toggleBtn.addEventListener("click", () => {
        container.parentNode.classList.toggle("dark-mode");
    });
}

function addFoldUnfoldButton(htmlDoc, container) {
    const foldBtn = htmlDoc.createElement("button");
    foldBtn.textContent = "Toggle All";
    foldBtn.style.cssText = "position: fixed; top: 10px; right: 10px; z-index: 9999; padding: 5px 10px;";
    htmlDoc.body.appendChild(foldBtn);

    let allFolded = true;

    foldBtn.addEventListener("click", () => {
        container.querySelectorAll("ul:not(#root-node)").forEach(ul => {
            if (allFolded) {
                ul.classList.add("collapsed");
            } else {
                ul.classList.remove("collapsed");
            }
        });

        container.querySelectorAll(".toggle").forEach(toggle => {
            toggle.textContent = allFolded ? "+" : "-";
        });

        allFolded = !allFolded;
    });
}




