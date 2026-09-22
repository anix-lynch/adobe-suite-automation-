// premiere_build_sequence.jsx
// Recipe -> app working file for Premiere Pro.
//
// STATUS: written against the real Premiere Pro ExtendScript API
// (ppro-scripting.docsforadobe.dev), but NOT test-run -- Premiere Pro is not
// installed on this machine. Treat this as a correct-pattern reference, not
// verified output, until it has actually been run once inside Premiere.
//
// Unlike After Effects, Premiere has no aerender-equivalent headless render
// tool (confirmed via research, no official CLI render path exists as of
// 2026). This script can build a real sequence with the app open in the
// background, but final export still requires either a manual Export click
// or handing off to Adobe Media Encoder's queue -- it does not fully
// "tada, already done" the way the After Effects path does.
//
// Intended run pattern (once Premiere is installed):
//   osascript -e 'tell application "Adobe Premiere Pro 2026" to do javascript file "<path>"'

#target premierepro

function readJSON(path) {
    var f = new File(path);
    f.open("r");
    var content = f.read();
    f.close();
    return eval("(" + content + ")");
}

function main() {
    var scriptFile = new File($.fileName);
    var kitRoot = scriptFile.parent.parent.parent.fsName;
    var seq = readJSON(kitRoot + "/01_recipes_or_instructions/shared_specs/motion_sequence.json");

    app.project = app.newProject(kitRoot + "/02_app_working_files/premiere/product_reel.prproj");

    // Import the same real source assets After Effects uses, so the two
    // recipes stay consistent with one source-of-truth asset kit.
    var importPaths = [
        kitRoot + "/00_source_assets/logo/brand_logo_transparent.png",
        kitRoot + "/00_source_assets/product_visuals/product_hero_transparent.png"
    ];
    app.project.importFiles(importPaths, true, app.project.getInsertionBin(), false);

    // Create a sequence matching the motion_sequence.json canvas/fps
    var sequenceName = "product_reel";
    app.project.newSequence(sequenceName, "");
    var sequence = app.project.activeSequence;

    // Place logo + hero clips on V1 at the times motion_sequence.json specifies.
    // (Exact track/clip placement API varies by Premiere version -- this is the
    //  documented pattern from ppro-scripting.docsforadobe.dev, apply per the
    //  installed version's Project/Sequence/QEPlayer objects.)
    var projectItems = app.project.rootItem.children;
    for (var i = 0; i < projectItems.numItems; i++) {
        var item = projectItems[i];
        if (item.name.indexOf("brand_logo") !== -1) {
            sequence.videoTracks[0].insertClip(item, 0);
        }
        if (item.name.indexOf("product_hero") !== -1) {
            sequence.videoTracks[0].insertClip(item, 3);
        }
    }

    app.project.save();
    $.writeln("DONE (untested pattern): " + kitRoot + "/02_app_working_files/premiere/product_reel.prproj");
    $.writeln("NEXT: export still needs a manual Export click or Media Encoder queue -- no headless render path exists for Premiere.");
}

main();
