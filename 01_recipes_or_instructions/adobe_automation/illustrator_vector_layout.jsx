#target illustrator
app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

function hexToRGB(hex) {
    hex = hex.replace("#", "");
    var c = new RGBColor();
    c.red = parseInt(hex.substring(0, 2), 16);
    c.green = parseInt(hex.substring(2, 4), 16);
    c.blue = parseInt(hex.substring(4, 6), 16);
    return c;
}
function getFont(name, fallback) {
    try { return app.textFonts.getByName(name); } catch (e) {
        try { return app.textFonts.getByName(fallback); } catch (e2) { return app.textFonts[0]; }
    }
}

var kitRoot = "/Users/anixlynch/dev/job_search/personal_brand/ecommerce_campaign_asset_kit";
var CANVAS_W = 700, CANVAS_H = 1000;
var CREAM = "#fbf8ef", INK = "#17324d", GOLD = "#b8935a", MUTED = "#7d8a99";
var MARGIN = 70; // the editorial "spine" -- everything left-aligns to this

function flipY(y) { return CANVAS_H - y; }

var doc = app.documents.add(DocumentColorSpace.RGB, CANVAS_W, CANVAS_H);

// ---- tag_shape: vertical rounded rect, thin hairline stroke ----
var tag = doc.pathItems.roundedRectangle(flipY(0), 0, CANVAS_W, CANVAS_H, 14, 14);
tag.name = "tag_shape";
tag.filled = true; tag.fillColor = hexToRGB(CREAM);
tag.stroked = true; tag.strokeColor = hexToRGB(INK); tag.strokeWidth = 0.75;
tag.position = [0, CANVAS_H]; // top of a Y-up-positioned shape must equal canvas height, not flipY(CANVAS_H)

// ---- punch_hole: thin ring, top-center, generous inset from edge ----
var holeR = 13;
var holeCX = CANVAS_W / 2, holeCY = 90;
var hole = doc.pathItems.ellipse(0, 0, holeR * 2, holeR * 2);
hole.name = "punch_hole";
hole.filled = false;
hole.stroked = true; hole.strokeColor = hexToRGB(INK); hole.strokeWidth = 0.75;
hole.position = [holeCX - holeR, flipY(holeCY - holeR)];

// ---- brand_location group: brand line + location line, tracked caps ----
var brandGroup = doc.groupItems.add();
brandGroup.name = "brand_location";

var brandLine = doc.textFrames.add();
brandLine.contents = "LUNA RETAIL";
brandLine.textRange.characterAttributes.size = 14;
brandLine.textRange.characterAttributes.tracking = 220;
brandLine.textRange.characterAttributes.fillColor = hexToRGB(INK);
brandLine.textRange.characterAttributes.textFont = getFont("Helvetica Neue", "ArialMT");
brandLine.position = [MARGIN, flipY(220)];
brandLine.move(brandGroup, ElementPlacement.PLACEATEND);

var locLine = doc.textFrames.add();
locLine.contents = "WEST HOLLYWOOD";
locLine.textRange.characterAttributes.size = 10.5;
locLine.textRange.characterAttributes.tracking = 200;
locLine.textRange.characterAttributes.fillColor = hexToRGB(MUTED);
locLine.textRange.characterAttributes.textFont = getFont("Helvetica Neue", "ArialMT");
locLine.position = [MARGIN, flipY(246)];
locLine.move(brandGroup, ElementPlacement.PLACEATEND);

// ---- accent: single gold hairline rule, short, functions as a divider ----
var accent = doc.pathItems.add();
accent.name = "accent";
accent.setEntirePath([[MARGIN, flipY(292)], [MARGIN + 56, flipY(292)]]);
accent.stroked = true; accent.strokeColor = hexToRGB(GOLD); accent.strokeWidth = 1.1;
accent.filled = false;

// ---- offer group: "10%" (serif, large) + "OFF" (sans, tracked, smaller) ----
var offerGroup = doc.groupItems.add();
offerGroup.name = "offer";

var pctText = doc.textFrames.add();
pctText.contents = "10%";
pctText.textRange.characterAttributes.size = 92;
pctText.textRange.characterAttributes.tracking = -10;
pctText.textRange.characterAttributes.fillColor = hexToRGB(INK);
pctText.textRange.characterAttributes.textFont = getFont("Georgia", "Times New Roman");
pctText.position = [MARGIN - 4, flipY(470)];
pctText.move(offerGroup, ElementPlacement.PLACEATEND);

var offText = doc.textFrames.add();
offText.contents = "OFF YOUR FIRST VISIT";
offText.textRange.characterAttributes.size = 13;
offText.textRange.characterAttributes.tracking = 260;
offText.textRange.characterAttributes.fillColor = hexToRGB(INK);
offText.textRange.characterAttributes.textFont = getFont("Helvetica Neue", "ArialMT");
offText.position = [MARGIN, flipY(625)]; // pushed well below the 92pt "10%" glyph box to stop overlap
offText.move(offerGroup, ElementPlacement.PLACEATEND);

// ---- fine_print: smallest, muted, bottom of tag, same spine ----
var finePrint = doc.textFrames.add();
finePrint.name = "fine_print";
finePrint.contents = "Valid at Luna Retail, West Hollywood\nConcept sample - not a live commercial offer";
finePrint.textRange.characterAttributes.size = 9;
finePrint.textRange.characterAttributes.tracking = 20;
finePrint.textRange.characterAttributes.fillColor = hexToRGB(MUTED);
finePrint.textRange.characterAttributes.textFont = getFont("Helvetica Neue", "ArialMT");
finePrint.position = [MARGIN, flipY(910)];

var workingDir = new Folder(kitRoot + "/02_app_working_files/illustrator");
if (!workingDir.exists) workingDir.create();
var aiFile = new File(workingDir + "/sale_hangtag.ai");
doc.saveAs(aiFile, new IllustratorSaveOptions());

var exportDir = new Folder(kitRoot + "/03_final_exports/ads");
if (!exportDir.exists) exportDir.create();
var pngFile = new File(exportDir + "/sale_hangtag.png");
var exportOpts = new ExportOptionsPNG24();
exportOpts.antiAliasing = true;
exportOpts.transparency = true;
exportOpts.artBoardClipping = true;
exportOpts.horizontalScale = 200;
exportOpts.verticalScale = 200;
doc.exportFile(pngFile, ExportType.PNG24, exportOpts);

doc.close(SaveOptions.DONOTSAVECHANGES);
$.writeln("DONE: " + aiFile.fsName);
