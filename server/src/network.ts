import os from 'os';

export type VpnType = 'tailscale' | 'hamachi' | 'radmin' | 'other_vpn';
export type IpCategory = 'localhost' | 'tailscale' | 'hamachi' | 'radmin' | 'lan' | 'other';

export function categorizeIpAddress(ip: string, ifaceName = ''): IpCategory {
  const lowerName = ifaceName.toLowerCase();

  if (ip.startsWith('127.')) {
    return 'localhost';
  }

  // Tailscale: 100.64.0.0/10 Carrier-grade NAT or interface name
  if (ip.startsWith('100.') || lowerName.includes('tailscale')) {
    return 'tailscale';
  }

  // Hamachi: 25.0.0.0/8 or interface name
  if (ip.startsWith('25.') || lowerName.includes('hamachi')) {
    return 'hamachi';
  }

  // Radmin VPN: 26.0.0.0/8 or interface name
  if (ip.startsWith('26.') || lowerName.includes('radmin')) {
    return 'radmin';
  }

  // Local private networks (RFC 1918)
  if (
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)
  ) {
    return 'lan';
  }

  return 'other';
}

export function getNetworkAddresses(
  port = 3001,
  interfaces: Record<string, os.NetworkInterfaceInfo[] | undefined> = os.networkInterfaces()
) {
  const lan: string[] = [];
  const vpn: { type: VpnType; url: string; iface: string }[] = [];

  for (const [ifaceName, infos] of Object.entries(interfaces)) {
    if (!infos) continue;
    for (const info of infos) {
      // Ignore IPv6 and internal loopback
      const isIpv4 = info.family === 'IPv4' || (info.family as unknown as number) === 4;
      if (!isIpv4 || info.internal) continue;

      const category = categorizeIpAddress(info.address, ifaceName);
      const url = `http://${info.address}:${port}`;

      if (category === 'lan') {
        lan.push(url);
      } else if (category === 'tailscale' || category === 'hamachi' || category === 'radmin') {
        vpn.push({
          type: category as VpnType,
          url,
          iface: ifaceName,
        });
      }
    }
  }

  return {
    localhost: `http://localhost:${port}`,
    lan,
    vpn,
  };
}
