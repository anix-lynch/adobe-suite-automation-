(async function () {
  const out = document.body;
  function log(msg) {
    const p = document.createElement("p");
    p.textContent = msg;
    out.appendChild(p);
  }

  const KIT_ROOT = "/Users/anixlynch/dev/job_search/personal_brand/ecommerce_campaign_asset_kit";
  const TARGET_PRPROJ = KIT_ROOT + "/02_app_working_files/premiere/product_reel.prproj";

  try {
    const ppro = require("premierepro");

    const project = await ppro.Project.getActiveProject();
    if (!project) {
      log("ERROR: no active project. Open/create a project in Premiere first.");
      return;
    }
    log("Active project: " + (await project.name));

    const importPaths = [
      KIT_ROOT + "/00_source_assets/logo/brand_logo_transparent.png",
      KIT_ROOT + "/00_source_assets/product_visuals/product_hero_transparent.png",
    ];

    const importOk = await project.importFiles(
      importPaths,
      true, // suppressUI
      null, // targetBin -> project root
      false // importAsNumberedStills
    );
    log("importFiles result: " + importOk);

    const rootItem = await project.getRootItem();
    const projectItems = await rootItem.getItems();
    log("Root item count after import: " + projectItems.length);

    const mediaItems = [];
    for (const item of projectItems) {
      const nm = await item.name;
      log("Found project item: " + nm);
      if (nm.indexOf("brand_logo") !== -1 || nm.indexOf("product_hero") !== -1) {
        mediaItems.push(item);
      }
    }

    if (mediaItems.length === 0) {
      log("ERROR: no matching media items found to build sequence from.");
      return;
    }

    const sequence = await project.createSequenceFromMedia(
      "product_reel",
      mediaItems
    );
    log("createSequenceFromMedia result: " + (sequence ? "sequence created" : "FAILED"));

    const saveOk = await project.saveAs(TARGET_PRPROJ);
    log("saveAs(" + TARGET_PRPROJ + ") result: " + saveOk);
    log("DONE");
  } catch (err) {
    log("ERROR: " + err.toString());
  }
})();
