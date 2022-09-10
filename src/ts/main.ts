// JS
import jQuery from "jquery";
import "jquery-ui-bundle";

declare global {
    interface Window {
        jQuery?: any;
        BASTHON_CACHE_BUSTING_TIMESTAMP?: string;
        basthonLanguage?: string;
        basthonRoot?: string;
    }
}

// Global settings
const url = new URL(window.location.href);
const params = url.searchParams;
const kernel = params.get('kernel') ?? "python3";
const shortcuts: { [key: string]: string } = {
    "py": "python3",
    "python": "python3",
    "js": "javascript",
};
window.basthonLanguage = shortcuts[kernel] ?? kernel;
window.basthonRoot = "assets";

window.BASTHON_CACHE_BUSTING_TIMESTAMP = Date.now().toString();
window.jQuery = jQuery;

import "../js/notebook/js/main";

// CSS
import "../css/style.less";
import "../css/ipython.less";
import "../css/override.css";
import "jquery-ui-themes/themes/smoothness/jquery-ui.min.css";
import "jquery-typeahead/dist/jquery.typeahead.min.css";
import "bootstrap-tour/build/css/bootstrap-tour.min.css";
import "codemirror/lib/codemirror.css";

// dynamically importing codemirror mode
switch (window.basthonLanguage) {
    case "python3":
        import('codemirror/mode/python/python');
        break;
    case "sql":
        import('codemirror/mode/sql/sql');
        break
    case "javascript":
        import('codemirror/mode/javascript/javascript');
        break;
    case "ocaml":
        import('codemirror/mode/mllike/mllike');
        break;
}
