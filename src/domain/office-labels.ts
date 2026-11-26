export const officeKindLabel={registered_office:'Registered office',corporate_office:'Corporate office',business_office:'Published business office'} as const;

import type {OfficeLocation} from './offices';
export function officeAccuracyLabel(office:Pick<OfficeLocation,'coordinate_method'|'precision'>){
  if(office.coordinate_method==='company_published_map_link')return 'Destination point published by the company. The visitor entrance has not been confirmed.';
  return office.precision==='campus'?'Campus-level location. The exact tower, floor and visitor entrance are not resolved.':'Building-level location. The floor and visitor entrance have not been confirmed.';
}
