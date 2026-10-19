import test from 'node:test';
import assert from 'node:assert/strict';
import { getNetworkAddresses, categorizeIpAddress } from '../server/dist/network.js';

test('categorizeIpAddress - identifies Tailscale IP', () => {
  assert.equal(categorizeIpAddress('100.85.12.3', 'tailscale0'), 'tailscale');
  assert.equal(categorizeIpAddress('100.115.92.10', 'Ethernet 2'), 'tailscale');
});

test('categorizeIpAddress - identifies Hamachi and Radmin IP', () => {
  assert.equal(categorizeIpAddress('25.10.20.30', 'hamachi0'), 'hamachi');
  assert.equal(categorizeIpAddress('26.40.50.60', 'radmin0'), 'radmin');
});

test('categorizeIpAddress - identifies local LAN IP', () => {
  assert.equal(categorizeIpAddress('192.168.1.105', 'Wi-Fi'), 'lan');
  assert.equal(categorizeIpAddress('10.0.0.15', 'Ethernet'), 'lan');
});

test('getNetworkAddresses - groups mocked interfaces properly', () => {
  const mockInterfaces = {
    lo: [
      { address: '127.0.0.1', family: 'IPv4', internal: true },
    ],
    'Wi-Fi': [
      { address: '192.168.0.50', family: 'IPv4', internal: false },
    ],
    tailscale0: [
      { address: '100.64.1.2', family: 'IPv4', internal: false },
    ],
  };

  const result = getNetworkAddresses(3001, mockInterfaces);
  assert.equal(result.localhost, 'http://localhost:3001');
  assert.ok(result.lan.includes('http://192.168.0.50:3001'));
  assert.ok(result.vpn.some(v => v.url === 'http://100.64.1.2:3001' && v.type === 'tailscale'));
});
