import assert from 'node:assert/strict';
import test from 'node:test';
import yaml from 'yaml';
import { PROXY_GROUP_TEMPLATES } from '@/lib/config/proxy-templates';
import { generateConfig } from './index';

const getTemplate = (id: string) => {
  const template = PROXY_GROUP_TEMPLATES.find(item => item.id === id);
  assert.ok(template, `missing proxy group template ${id}`);
  return template;
};

test('default non-ad groups do not include REJECT policy', () => {
  for (const group of PROXY_GROUP_TEMPLATES) {
    if (group.id === '3') continue;
    assert.equal(
      group.policyOptions.includes('reject'),
      false,
      `${group.name} should not include REJECT by default`
    );
  }
});

test('default proxy groups select all nodes while ad blocking keeps REJECT', () => {
  const config = yaml.parse(generateConfig({
    proxies: [
      { name: 'HK node', type: 'ss', server: 'hk.example.com', port: 8388, cipher: 'aes-128-gcm', password: 'secret' },
      { name: 'US node', type: 'ss', server: 'us.example.com', port: 8388, cipher: 'aes-128-gcm', password: 'secret' },
    ],
    proxyGroups: [getTemplate('1'), getTemplate('3'), getTemplate('6')],
    rules: [],
  }));

  const groups = new Map(config['proxy-groups'].map((group: any) => [group.name, group.proxies]));
  const mainGroup = groups.get('🚀 节点选择') as string[];
  const adGroup = groups.get('🛑 广告拦截') as string[];
  const googleGroup = groups.get('🔍 谷歌服务') as string[];

  assert.deepEqual(mainGroup.includes('REJECT'), false);
  assert.deepEqual(googleGroup.includes('REJECT'), false);
  assert.deepEqual(adGroup.includes('REJECT'), true);
  assert.deepEqual(adGroup.includes('DIRECT'), true);
  assert.deepEqual(adGroup.includes('🚀 节点选择'), true);
  assert.deepEqual(adGroup.includes('⚡ 自动选择'), false);
  assert.deepEqual(mainGroup.includes('HK node'), true);
  assert.deepEqual(mainGroup.includes('US node'), true);
  assert.deepEqual(googleGroup.includes('HK node'), true);
  assert.deepEqual(googleGroup.includes('US node'), true);
});
