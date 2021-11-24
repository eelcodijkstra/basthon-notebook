const HtmlWebpackPlugin = require('html-webpack-plugin');
const CreateFileWebpack = require('create-file-webpack');
const path = require('path');
const util = require('util');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const SymlinkWebpackPlugin = require('symlink-webpack-plugin');

const rootPath = path.resolve(__dirname, "..");
const buildPath = path.join(rootPath, "build");
const assetsPath = path.join(buildPath, "assets");
const kernelVersion = require(path.join(rootPath, 'package.json')).devDependencies["@basthon/kernel-python3"];

const languages ={
    "python3": "Python 3",
    "javascript": "JavaScript",
    "sql": "SQL"
};

// build version file
async function version() {
    const exec = util.promisify(require('child_process').exec);
    let lastCommit = await exec('date -d @$(git log -1 --format="%at") +%Y/%m/%d_%H:%M:%S');
    lastCommit = lastCommit.stdout.trim();
    const version = `${lastCommit}_kernel_${kernelVersion}`;

    return new CreateFileWebpack({
        content: version,
        fileName: "version",
        path: assetsPath
    });
}

// generate index.html from template src/html/index.html
function html(language, languageName) {
    return new HtmlWebpackPlugin({
        hash: true,
        language: language,
        languageName: languageName,
        template: "./src/html/index.html",
        filename: `../${language}/index.html`,
        publicPath: "assets/",
        favicon: "./src/assets/favicon/favicon.ico",
        inject: "head",
        scriptLoading: "blocking"
    });
}

// all index.html
function htmls() {
    return Object.keys(languages).map(l => html(l, languages[l]));
}

// bundle css
function css() {
    return new MiniCssExtractPlugin({
        filename: "[name].[contenthash].css"
    });
}
/*
// htaccess copy
function htaccess() {
    return new CopyPlugin({
        patterns: [{ from: "./src/.htaccess", to: buildPath }],
    });
}*/

// basthon kernel copy
function python3files() {
    return new CopyPlugin({
        patterns: [{
            from: "**/*",
            context: "./node_modules/@basthon/kernel-python3/lib/dist/",
            to: path.join(assetsPath, kernelVersion),
            toType: "dir"
        }]
    });
}

// copies
function copies() {
    return new CopyPlugin({
        patterns: [
            {
                from: "examples/**/*",
                to: buildPath,
                toType: "dir"
            },
            {
                from: "api/**/*",
                to: buildPath,
                context: "./notebook/",
                toType: "dir"
            },
            {
                from: "kernelspecs/**/*",
                to: buildPath,
                context: "./notebook/",
                toType: "dir"
            },
            {
                from: "static/**/*",
                to: buildPath,
                context: "./notebook/",
                toType: "dir"
            }]
    });
}

function languageSymlinks() {
    const links = [{ origin: '../python3/index.html', symlink: '../index.html', force: true },
                   { origin: '../python3/', symlink: '../python', force: true },
                   { origin: '../javascript/', symlink: '../js', force: true }
                  ];
    Object.keys(languages).forEach(language =>
        ['api', 'assets', 'kernelspecs', 'static'].forEach(folder =>
            links.push( { origin: `../${folder}/`,
                          symlink: `../${language}/${folder}`,
                          force: true } )
        )
    );
    return new SymlinkWebpackPlugin(links);
}

async function main() {
    return {
        entry: "./src/ts/main.ts",
        output: {
            filename: '[name].[contenthash].js',
            chunkFilename: '[name].[contenthash].js',
            path: assetsPath
        },
        module: {
            rules: [
                {
                    test: /\.less$/i,
                    use: [
                        // compiles Less to CSS
                        "style-loader",
                        "css-loader",
                        "less-loader"
                    ],
                },
                {
                    test: /\.css$/,
                    use: [MiniCssExtractPlugin.loader, "css-loader"],
                }
            ],
        },
        resolve: {
            extensions: ['.ts', '.js'],
            modules: ['src/js/', 'node_modules/'],
        },
        plugins: [
            ...htmls(),
            css(),
            await version(),
            //htaccess(),
            python3files(),
            copies(),
            languageSymlinks()
        ],
        devServer: {
            static: {
                directory: buildPath,
            },
            compress: true,
            port: 8888,
        },
    };
}

module.exports = main;