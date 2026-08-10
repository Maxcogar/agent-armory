export const APS_AUTH_URL = "https://developer.api.autodesk.com/authentication/v2";
export const APS_MODEL_DERIVATIVE_URL = "https://developer.api.autodesk.com/modelderivative/v2";
export const APS_DATA_URL = "https://developer.api.autodesk.com/data/v1";
export const APS_PROJECT_URL = "https://developer.api.autodesk.com/project/v1";

// Manufacturing Data Model GraphQL (v2). Verified: this URL returns 401 unauthenticated
// (endpoint exists); /manufacturing/graphql/v1 and /fusiondata/2022-04/graphql return 404
// (the latter was v1, retired 2025-03-24).
// NOTE: v2 carries a "will be deprecated soon" banner. v3 is /mfg/v3/graphql/public and
// removes ComponentVersion entirely, so migrating is a rewrite of every GraphQL tool here,
// not a URL swap. No v2 EOL date is published.
export const APS_MFG_GRAPHQL_URL = "https://developer.api.autodesk.com/mfg/graphql";

// Union of the scopes each endpoint's reference page documents as required:
//   POST /mfg/graphql            -> data:create data:read data:write data:search
//   GET  .../folders/:id/search  -> data:search data:read
//   Data Management (browsing)   -> data:read
//   Model Derivative viewables   -> viewables:read
// The scopes guide states: "scopes are mandatory for all access tokens; calls without
// scopes will be rejected." data:read alone is NOT sufficient — aps_generate_step calls
// derivatives(generate: true), which creates data.
//
// Changing this list invalidates existing refresh tokens: the token endpoint requires
// refresh scopes to be "the same with or a subset of the scopes used to generate the
// refresh_token". Widening the set forces one re-authentication.
export const APS_SCOPES = "data:read data:write data:create data:search viewables:read";

export const CHARACTER_LIMIT = 50000;
