import test from 'node:test';
import assert from 'node:assert/strict';
import {compactUsd} from '../src/domain/presentation';
test('compact funding labels keep undisclosed separate, preserve small fractions and never use floating point',()=>{
  assert.equal(compactUsd(null),'Undisclosed');assert.equal(compactUsd('0.0001'),'$0.0001');assert.equal(compactUsd('28120802900'),'$28.12B');assert.equal(compactUsd('9007199254740993'),'$9007.2T');assert.throws(()=>compactUsd('NaN'));
});
test('display rounding promotes units at the boundary without producing thousand-unit labels',()=>{
  assert.equal(compactUsd('999999'),'$1M');assert.equal(compactUsd('999999999'),'$1B');assert.equal(compactUsd('2350000'),'$2.35M');assert.equal(compactUsd('1000'),'$1K');
});
