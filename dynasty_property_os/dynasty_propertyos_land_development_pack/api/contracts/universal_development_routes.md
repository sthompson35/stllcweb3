# Universal Development API Routes

Base path: /api/v1/development

## POST /parcels
Create parcel intake record.

## POST /projects
Create development project from parcel.

## POST /projects/{project_id}/site-zones
Add build pads, driveway, parking, landscape, stormwater, utility easements.

## POST /projects/{project_id}/structures
Add SFR, duplex, multifamily, retail, office, warehouse, garage, ADU, etc.

## POST /projects/{project_id}/utilities
Add water, sewer, septic, electric, gas, fiber, stormwater.

## POST /projects/{project_id}/cost-model
Generate sitework + utility + foundation + vertical construction estimate.

## POST /projects/{project_id}/blender-job
Trigger Blender site and structure digital twin generation.

## GET /projects/{project_id}/feasibility
Return zoning, cost, ROI, lender, and development feasibility summary.
