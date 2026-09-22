// after_effects_build_reel.jsx
// Recipe -> app working file for After Effects.
// Reads shared_specs/motion_sequence.json, builds a real animated
// composition (logo fade, product scale-bounce, headline slide, CTA fade),
// saves the .aep, adds a render-queue item. Actual MP4 render happens
// separately via `aerender` (fully headless, no GUI needed for that step).
//
// PREREQUISITE (one-time, human-only, per machine):
//   After Effects > Settings > Scripting & Expressions >
//   "Allow Scripts to Write Files and Access Network" must be checked.
//   Without it every file read/write in this script throws
//   "Permission denied" -- this is the actual root cause if this script
//   appears to silently do nothing.
//
// Run via AE's Scripts/Startup/ folder (copy this file there, relaunch AE --
// the only real headless-launch mechanism AE has; there is no
// `do javascript` AppleScript hook the way Photoshop/Illustrator have).

#target aftereffects
app.beginSuppressDialogs();

function readJSON(path) {
    var f = new File(path);
    f.open("r");
    var content = f.read();
    f.close();
    return eval("(" + content + ")");
}

function rgbFloat(hex) {
    hex = hex.replace("#", "");
    return [
        parseInt(hex.substring(0, 2), 16) / 255,
        parseInt(hex.substring(2, 4), 16) / 255,
        parseInt(hex.substring(4, 6), 16) / 255
    ];
}

function centerTextAnchor(layer) {
    var bounds = layer.sourceRectAtTime(0, false);
    layer.property("Transform").property("Anchor Point").setValue([
        bounds.left + bounds.width / 2,
        bounds.top + bounds.height / 2
    ]);
}

function main() {
    // NOTE: when this script runs from AE's Scripts/Startup/ folder,
    // $.fileName resolves to the Startup folder location, not this file's
    // real home -- so deriving kitRoot from it computes the wrong path.
    // Hardcoded to this specific asset kit's real location on disk instead.
    var kitRoot = "/Users/anixlynch/dev/job_search/personal_brand/ecommerce_campaign_asset_kit";

    var seq = readJSON(kitRoot + "/01_recipes_or_instructions/shared_specs/motion_sequence.json");
    var colors = readJSON(kitRoot + "/00_source_assets/brand_tokens/colors.json");

    var comp = app.project.items.addComp(
        "product_reel", seq.canvas.width, seq.canvas.height, 1,
        seq.duration_seconds, seq.fps
    );

    comp.layers.addSolid(rgbFloat(colors.cream), "Background", seq.canvas.width, seq.canvas.height, 1);

    // Logo layer: fade in 0-3s
    var logoFile = new File(kitRoot + "/00_source_assets/logo/brand_logo_transparent.png");
    if (logoFile.exists) {
        var logoFootage = app.project.importFile(new ImportOptions(logoFile));
        var logoLayer = comp.layers.add(logoFootage);
        logoLayer.property("Transform").property("Position").setValue([seq.canvas.width / 2, 300]);
        logoLayer.property("Transform").property("Opacity").setValueAtTime(0, 0);
        logoLayer.property("Transform").property("Opacity").setValueAtTime(3, 100);
    }

    // Product hero layer with scale-bounce entrance, 3-15s -- uses the real
    // approved product photo (same asset Photoshop's product_listing_working.psd
    // uses), not a placeholder cartoon, matching the quality bar already approved.
    // The original real_photo_1200.png is actually JPEG bytes with a .png
    // suffix. Photoshop tolerates that mismatch; AE importFile() returns
    // undefined. Use the normalized, real PNG derivative for AE.
    var heroFile = new File(kitRoot + "/00_source_assets/_presized/real_photo_1200_true.png");
    if (heroFile.exists) {
        var heroFootage = null;
        try {
            heroFootage = app.project.importFile(new ImportOptions(heroFile));
        } catch (importErr) {
            heroFootage = null;
        }
        if (heroFootage) {
        var heroLayer = comp.layers.add(heroFootage);
        heroLayer.startTime = 3;
        heroLayer.property("Transform").property("Position").setValue([seq.canvas.width / 2, seq.canvas.height / 2]);
        var scaleProp = heroLayer.property("Transform").property("Scale");
        scaleProp.setValueAtTime(3, [20, 20]);
        scaleProp.setValueAtTime(4.5, [82, 82]);
        scaleProp.setValueAtTime(5, [72, 72]);
        scaleProp.setValueAtTime(5.3, [75, 75]);
        }
    }

    // Headline text with slide-up, 7-11s
    var headlineLayer = comp.layers.addText("Sell designer goods\rwith confidence.");
    headlineLayer.startTime = 7;
    var headlineText = headlineLayer.property("Source Text").value;
    headlineText.fontSize = 72;
    headlineText.fillColor = rgbFloat(colors.navy);
    headlineText.applyFill = true;
    headlineText.justification = ParagraphJustification.CENTER_JUSTIFY;
    headlineLayer.property("Source Text").setValue(headlineText);
    centerTextAnchor(headlineLayer);
    var headlinePos = headlineLayer.property("Transform").property("Position");
    headlinePos.setValueAtTime(7, [seq.canvas.width / 2, 1580]);
    headlinePos.setValueAtTime(7.6, [seq.canvas.width / 2, 1430]);

    // CTA text fade in, 11-15s -- branded ending, stays visible through the out
    var ctaLayer = comp.layers.addText("Follow @lunaretail");
    ctaLayer.startTime = 11;
    var ctaText = ctaLayer.property("Source Text").value;
    ctaText.fontSize = 54;
    ctaText.fillColor = rgbFloat(colors.green_accent);
    ctaText.applyFill = true;
    ctaText.justification = ParagraphJustification.CENTER_JUSTIFY;
    ctaLayer.property("Source Text").setValue(ctaText);
    centerTextAnchor(ctaLayer);
    ctaLayer.property("Transform").property("Position").setValue([seq.canvas.width / 2, 1710]);
    ctaLayer.property("Transform").property("Opacity").setValueAtTime(11, 0);
    ctaLayer.property("Transform").property("Opacity").setValueAtTime(12, 100);

    comp.duration = seq.duration_seconds;
    var renderItem = app.project.renderQueue.items.add(comp);
    var videoDir = new Folder(kitRoot + "/03_final_exports/video");
    if (!videoDir.exists) videoDir.create();
    var outputModule = renderItem.outputModule(1);
    try {
        outputModule.applyTemplate("H.264 - Match Render Settings - 15 Mbps");
    } catch (templateErr) {
        // aerender may apply the installed template explicitly; the semantic
        // output path must still be correct inside the saved project.
    }
    outputModule.file = new File(videoDir.fsName + "/product_reel.mp4");

    var workingDir = new Folder(kitRoot + "/02_app_working_files/after_effects");
    if (!workingDir.exists) workingDir.create();
    var aepFile = new File(workingDir.fsName + "/15s_product_reel.aep");
    app.project.save(aepFile);
}

main();
app.endSuppressDialogs(true);
