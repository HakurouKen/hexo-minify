import fs from 'fs';
import path from 'path';
import url from 'url';
import cheerio from 'cheerio';
import CleanCSS from 'clean-css';
import UglifyJS from 'uglify-js';
import { minify as HtmlMinify } from 'html-minifier';

function localUrl (urlPath) {
    let u = url.parse(urlPath, false, true);
    return u.host ? null : u.pathname;
}

function styleProcessor($, options = {}) {
    let {
        root = '.',
        limit = 8192
    } = options;
    const URL_PATTERN = /url\((.*?)\)/g;
    $('link[href]').each((i, elem) => {
        let $self = $(elem);
        let href = localUrl($self.attr('href') || '');
        let rel = $self.attr('rel');
        if (!href || rel && rel != 'stylesheet') return;

        let filePath = path.join(root,href);
        let source = fs.readFileSync(filePath);
        let style = new CleanCSS({
            processImport: true,
            processImportFrom: ['local'],
            rebase: true,
        }).minify(source).styles;
        if (style.length < limit) {
            let dirname = '/' + path.relative(root, path.dirname(href));
            style = style.replace(URL_PATTERN, (_,u) => {
                let _url = localUrl(u);
                if (!_url || _url.startsWith('/')) {
                    return `url(${u})`;
                }
                return `url(${path.join(dirname,u)})`;
            });
            $self.replaceWith($(`<style>${style}</style>`));
        } else {
            fs.writeFileSync(filePath,style);
        }
    });
}

function scriptProcessor($, options = {}) {
    let {
        root = '.',
        limit = 8192
    } = options;
    $('script[src]').each((i,elem) => {
        let $self = $(elem);
        let src = localUrl($self.attr('src') || '');

        if (!src) return;
        let filePath = path.join(root,src);
        let script = UglifyJS.minify(filePath);
        if (script.length < limit) {
            $self.replaceWith($(`<script>${script.code}</script>`));
        } else {
            fs.writeFileSync(filePath,script);
        }
    });
}

function htmlProcessor($, options = {}) {
    return HtmlMinify($.html(),Object.assign({
        collapseBooleanAttributes: true,
        collapseInlineTagWhitespace: true,
        collapseWhitespace: true,
        conservativeCollapse: true,
        minifyCSS: true,
        minifyJS: true,
        removeAttributeQuotes: true,
        removeComments: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
    },options || {}));

}

export default function processor(html, options) {
    let $ = cheerio.load(html);
    styleProcessor($, options.CssMinify || {});
    scriptProcessor($, options.JsMinify || {});
    return htmlProcessor($, options.HtmlMinify || {})
}
