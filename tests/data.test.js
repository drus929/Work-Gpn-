import test from 'node:test';
import assert from 'node:assert/strict';
import {plants} from '../src/data.js';
test('catalog has unique plants, capacity threshold, coordinates and required fields',()=>{
 assert.equal(new Set(plants.map(p=>p.id)).size,plants.length);
 assert.ok(plants.length>0);
 for(const p of plants){assert.ok(p.capacity>=3);assert.ok(p.lon>=19&&p.lon<=180);assert.ok(p.lat>=41&&p.lat<=82);for(const k of ['name','region','owner','rail'])assert.ok(p[k]);assert.ok(p.products.length>0)}
});
