CREATE EXTENSION IF NOT EXISTS postgis;
-- Managed providers may already install PostGIS in a schema other than public.
DO $$ DECLARE extension_schema text; BEGIN
  SELECT n.nspname INTO extension_schema FROM pg_extension e
    JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='postgis';
  PERFORM set_config('search_path',format('pg_catalog,%I,bp',extension_schema),true);
END $$;
ALTER TABLE bp.company_locations ADD COLUMN geom geometry(Point,4326)
  GENERATED ALWAYS AS (CASE WHEN latitude IS NOT NULL THEN
    ST_SetSRID(ST_MakePoint(longitude::double precision,latitude::double precision),4326)
    ELSE NULL END) STORED;
CREATE INDEX locations_geom_idx ON bp.company_locations USING gist (geom);

CREATE FUNCTION bp.companies_in_area(area_geojson text, include_coarse boolean DEFAULT false)
RETURNS TABLE(company_id uuid) LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path FROM CURRENT AS $$
DECLARE area geometry;
BEGIN
  IF length(area_geojson) > 100000 THEN RAISE EXCEPTION 'Area too large' USING ERRCODE='22023'; END IF;
  area := ST_SetSRID(ST_GeomFromGeoJSON(area_geojson),4326);
  IF ST_GeometryType(area) <> 'ST_Polygon' OR ST_IsEmpty(area)
     OR NOT ST_IsValid(area) OR ST_NPoints(area) > 1000 THEN
    RAISE EXCEPTION 'A valid polygon with at most 1000 vertices is required' USING ERRCODE='22023';
  END IF;
  IF ST_XMin(Box3D(area)) < -180 OR ST_XMax(Box3D(area)) > 180
     OR ST_YMin(Box3D(area)) < -90 OR ST_YMax(Box3D(area)) > 90 THEN
    RAISE EXCEPTION 'Coordinates outside longitude/latitude range' USING ERRCODE='22023';
  END IF;
  RETURN QUERY WITH latest_hq AS (
    SELECT DISTINCT ON (l.company_id) l.* FROM bp.company_locations l
    WHERE l.kind = 'hq' AND l.observed_on <= current_date
    ORDER BY l.company_id,l.observed_on DESC,l.location_key
  ) SELECT l.company_id FROM latest_hq l
    WHERE l.geom IS NOT NULL
    AND (include_coarse OR l.accuracy = 'address') AND ST_Covers(area,l.geom);
END;
$$;
REVOKE EXECUTE ON FUNCTION bp.companies_in_area(text,boolean) FROM PUBLIC;
