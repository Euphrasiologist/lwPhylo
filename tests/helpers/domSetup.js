import { JSDOM } from "jsdom";

// drawPhylogeny() builds SVG DOM nodes via d3, which needs a `document` to
// exist on the global object. Node has no DOM by default, so tests that
// exercise the real rendering path install one via jsdom.
const dom = new JSDOM("<!DOCTYPE html><body></body>");
global.window = dom.window;
global.document = dom.window.document;
global.DOMParser = dom.window.DOMParser;
global.XMLSerializer = dom.window.XMLSerializer;
