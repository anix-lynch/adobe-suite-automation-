// photoshop_build_layers.jsx
// Recipe -> app working file for Photoshop.
// Reads one or more shared_specs/*.json layout files, imports source assets
// as named layers (image placement + real text layers), saves a layered PSD
// to 02_app_working_files/photoshop/, and exports a flat PNG to the matching
// 03_final_exports/ subfolder.
//
// Run headless-ish (no manual clicking) via:
//   osascript -e 'tell application "Adobe Photoshop 2026" to do javascript file "<path>"'
// Photoshop must already be running (or the OS will launch it); this script
// does not require any window focus or user interaction.

#target photoshop
app.displayDialogs = DialogModes.NO;

function readJSON(path) {
    var f = new File(path);
    f.open("r");
    var content = f.read();
    f.close();
    return eval("(" + content + ")");
}

function readText(path) {
    var f = new File(path);
    f.open("r");
    var content = f.read();
    f.close();
    return content;
}

function rgbColor(hex) {
    var c = new SolidColor();
    hex = hex.replace("#", "");
    c.rgb.red = parseInt(hex.substring(0, 2), 16);
    c.rgb.green = parseInt(hex.substring(2, 4), 16);
    c.rgb.blue = parseInt(hex.substring(4, 6), 16);
    return c;
}

// jobs: [ {spec, outputPsdName, outputPngPath} ]
function buildFromSpec(kitRoot, spec, psdOutPath, pngOutPath) {
    var doc = app.documents.add(
        spec.canvas.width, spec.canvas.height, 72,
        "build", NewDocumentMode.RGB, DocumentFill.WHITE
    );

    if (spec.background_color) {
        var bg = doc.artLayers.add();
        bg.name = "Background";
        doc.selection.selectAll();
        doc.selection.fill(rgbColor(spec.background_color));
        doc.selection.deselect();
    }

    for (var i = 0; i < spec.layers.length; i++) {
        var L = spec.layers[i];

        if (L.type === "image") {
            var imgFile = new File(kitRoot + "/" + L.source);
            if (imgFile.exists) {
                var src = app.open(imgFile);
                // source assets are pre-sized to exact target pixels (see _presized/);
                // no in-app resize here, avoids Photoshop's resolution/paste scaling quirk
                src.selection.selectAll();
                src.selection.copy();
                src.close(SaveOptions.DONOTSAVECHANGES);
                var pasted = doc.paste();
                pasted.name = L.name;
                pasted.translate(L.x - pasted.bounds[0].as("px"), L.y - pasted.bounds[1].as("px"));
            }
        } else if (L.type === "text") {
            var content = L.content;
            if (!content && L.source_file) {
                content = readText(kitRoot + "/" + L.source_file);
            }
            // Photoshop TextItem line breaks are \r, not \n
            content = content.replace(/\r\n/g, "\r").replace(/\n/g, "\r");
            var tLayer = doc.artLayers.add();
            tLayer.kind = LayerKind.TEXT;
            tLayer.name = L.name;
            var ti = tLayer.textItem;
            ti.contents = content;
            ti.position = [L.x, L.y];
            ti.size = L.size ? L.size : 42;
            if (L.color) ti.color = rgbColor(L.color);
        }
        // data_ref layers are intentionally not rendered -- they document
        // which JSON drove the build, not a visual element.
    }

    var psdFolder = new Folder(psdOutPath).parent;
    if (!psdFolder.exists) psdFolder.create();
    doc.saveAs(new File(psdOutPath), new PhotoshopSaveOptions(), true);

    var pngFolder = new Folder(pngOutPath).parent;
    if (!pngFolder.exists) pngFolder.create();
    doc.saveAs(new File(pngOutPath), new PNGSaveOptions(), true);

    doc.close(SaveOptions.DONOTSAVECHANGES);
    return psdOutPath;
}

function main() {
    var scriptFile = new File($.fileName);
    var kitRoot = scriptFile.parent.parent.parent.fsName; // .../ecommerce_campaign_asset_kit

    var jobs = [
        {
            spec: readJSON(kitRoot + "/01_recipes_or_instructions/shared_specs/promo_banner_layout.json"),
            psd: kitRoot + "/02_app_working_files/photoshop/promo_banner_working.psd",
            png: kitRoot + "/03_final_exports/email/promo_email_banner.png"
        },
        {
            spec: readJSON(kitRoot + "/01_recipes_or_instructions/shared_specs/product_listing_layout.json"),
            psd: kitRoot + "/02_app_working_files/photoshop/product_listing_working.psd",
            png: kitRoot + "/03_final_exports/marketplace/product_listing_image.png"
        },
        {
            spec: readJSON(kitRoot + "/01_recipes_or_instructions/shared_specs/ig_square_layout.json"),
            psd: kitRoot + "/02_app_working_files/photoshop/ig_square_working.psd",
            png: kitRoot + "/03_final_exports/social/ig_square.png"
        },
        {
            spec: readJSON(kitRoot + "/01_recipes_or_instructions/shared_specs/fb_landscape_layout.json"),
            psd: kitRoot + "/02_app_working_files/photoshop/fb_landscape_working.psd",
            png: kitRoot + "/03_final_exports/social/fb_landscape.png"
        },
        {
            spec: readJSON(kitRoot + "/01_recipes_or_instructions/shared_specs/story_vertical_layout.json"),
            psd: kitRoot + "/02_app_working_files/photoshop/story_vertical_working.psd",
            png: kitRoot + "/03_final_exports/social/story_vertical.png"
        }
    ];

    var results = [];
    for (var j = 0; j < jobs.length; j++) {
        var out = buildFromSpec(kitRoot, jobs[j].spec, jobs[j].psd, jobs[j].png);
        results.push(out);
    }
    $.writeln("DONE: " + results.join(", "));
}

main();
