-- lightroom_batch_preset_workflow.lua
--
-- STATUS: documentation / representative stub, not tested code.
-- Lightroom is not installed on this machine, and Lightroom automation is a
-- genuinely different paradigm from Photoshop/Illustrator/After Effects:
-- it's a catalog + plugin SDK (Lua, via the Lightroom SDK's LrExportSession /
-- LrDevelopController APIs), not a per-file ExtendScript that opens a
-- document and draws into it. There is no "do javascript"-equivalent single
-- script you point at one image.
--
-- The real workflow this represents:
--
-- 1. A Develop preset (.xmp) is created once, either by hand in Lightroom's
--    Develop module or generated as a plain XMP sidecar file (this IS
--    scriptable without Lightroom open -- XMP is just structured text).
--    See: 02_app_working_files/lightroom/product_photo_batch_preset.xmp
--
-- 2. A Lightroom plugin (this .lua file's real equivalent, loaded via
--    Lightroom's Plugin Manager) would:
--      a. use LrApplication.activeCatalog() to get the open catalog
--      b. select all photos tagged with a given keyword/collection
--         (e.g. "luna_retail_product_photos")
--      c. apply the saved Develop preset to each via LrDevelopController
--         or catalog:withWriteAccessDo(...) + photo:applyDevelopPreset(...)
--      d. run an LrExportSession with the shared_specs output sizes
--         (see ../shared_specs/social_sizes.json) to batch-export JPEGs
--
-- 3. This only runs *inside* Lightroom via its Plugin Manager -- there is no
--    CLI entrypoint, no equivalent of aerender or `do javascript`. A real
--    implementation would be a full plugin folder (Info.lua + this file),
--    not a single script invoked from Terminal.
--
-- Representative pseudocode for step 2c/2d (not runnable outside a real
-- Lightroom plugin context):

local LrApplication = import 'LrApplication'
local LrExportSession = import 'LrExportSession'
local LrTasks = import 'LrTasks'

LrTasks.startAsyncTask(function()
    local catalog = LrApplication.activeCatalog()
    local sourcePhotos = catalog:getTargetPhotos()

    catalog:withWriteAccessDo("Apply Luna Retail batch preset", function()
        for _, photo in ipairs(sourcePhotos) do
            -- photo:applyDevelopPreset(presetPath, plugin) goes here
        end
    end)

    local exportSession = LrExportSession {
        photosToExport = sourcePhotos,
        exportSettings = {
            LR_format = "JPEG",
            LR_export_destinationType = "specificFolder",
            LR_export_destinationPathPrefix = "../../03_final_exports/social",
            LR_size_maxWidth = 1080,
            LR_size_maxHeight = 1080,
        },
    }
    exportSession:doExportOnCurrentTask()
end)
