
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

    //search by xpath
    const input = document.getElementById("xpath-input");
    input.addEventListener("input", () => {
        console.log("input", input.value);
        const xpath = input.value.trim();
        if (!xpath) {
            clearHighlights();
            return;
        }

        if (isValidXPath(xpath, xmlElement)) {
            highlightXPathMatches(xpath, xmlElement);
        } else {
            clearHighlights();
        }
    });
}





function renderXMLTree(xmlNode) {
    if (!xmlNode){
        const msg = "No xml node found.";
        console.error(msg);
        return msg;
    }

    // Initialize a static counter on the function
    if (typeof renderXMLTree.nodeIdCounter === 'undefined') {
        renderXMLTree.nodeIdCounter = 0;
    }
    // Assign a unique ID to the XML node
    const nodeId = renderXMLTree.nodeIdCounter++;
    xmlNode.__node_id = nodeId;

    let html = "<li data-xml-node-id='" + nodeId + "'>";

    // Check if the node is an ELEMENT node (e.g., <tag>)
    if (xmlNode.nodeType === Node.ELEMENT_NODE) {
        let hasChildren = xmlNode.children.length > 0;
        let hasText = xmlNode.textContent.trim().length > 0;
        let isEmpty = !hasChildren && !hasText;

        console.log(xmlNode.attributes);
        let attributesString = attributesToString(xmlNode.attributes);
        let toggleSymbol = hasChildren ? `<span class="toggle">+</span>` : "";
        let openingTagWithAttributes = `<span class="node-tag">&lt;${xmlNode.nodeName} <span class="node-attributes">${attributesString}</span>&gt;</span>`;
        let openingTagNoAttributes = `<span class="node-tag">&lt;${xmlNode.nodeName}&gt;</span>`;
        let openingTag = attributesString.trim() === "" ? openingTagNoAttributes : openingTagWithAttributes;
        let closingTag = `<span class="node-tag">&lt;/${xmlNode.nodeName}&gt;</span>`;

        if (isEmpty) {
            // Self-closing tag for empty nodes
            let withAttributes= `${toggleSymbol} <span class="node-tag">&lt;${xmlNode.nodeName} <span class="node-attributes">${attributesString}</span>/&gt;</span>`;
            let noAttributes = `${toggleSymbol} <span class="node-tag">&lt;${xmlNode.nodeName}/&gt;</span>`;
            html += attributesString.trim() === "" ? noAttributes : withAttributes;
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
    addXPathInput(htmlDoc, container);


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

function addXPathInput(htmlDoc, container) {
    const input = htmlDoc.createElement("input");
    input.type = "text";
    input.placeholder = "Enter XPath...";
    input.id = "xpath-input";
    input.style.cssText = `
    width: 100%;
    padding: 6px;
    margin-bottom: 8px;
    font-size: 14px;
  `;

    container.prepend(input);
}




function isValidXPath(xpath, contextNode) {

    try {
        document.evaluate(xpath, contextNode, null, XPathResult.ANY_TYPE, null);
        console.log('valid')
        return true;
    } catch (e) {
        return false;
    }
}

function clearHighlights() {
    document.querySelectorAll('.xpath-highlight').forEach(el => {
        el.classList.remove('xpath-highlight');
    });
}

function highlightXPathMatches(xpath, contextNode) {
    clearHighlights();
    try {
        const result = document.evaluate(
            xpath,
            contextNode,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null
        );

        console.log(result);

        for (let i = 0; i < result.snapshotLength; i++) {
            const node = result.snapshotItem(i);
            console.log(node);

            if (node.nodeType === Node.ELEMENT_NODE) {
                console.log(node);
                console.log(node.__node_id);
                const renderedNode = document.querySelector(`[data-xml-node-id="${node.__node_id}"]`);
                if (renderedNode) {
                    renderedNode.classList.add('xpath-highlight');
                }
            }
        }
    } catch (e) {
        // Invalid XPath, do nothing or log error
    }
}

function attributesToString(attributes) {
    if (!attributes || attributes.length === 0) return "";

    let result = [];
    for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];
        result.push(`${attr.name}="${attr.value}"`);
    }
    return result.join(" ");
}