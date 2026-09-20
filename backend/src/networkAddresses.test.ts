import { getListeningAddresses } from './networkAddresses';

describe('getListeningAddresses', () => {
    it('always includes localhost first', () => {
        expect(getListeningAddresses(3010, {})).toEqual(['http://localhost:3010']);
    });

    // Caso real que motivó esto: el mensaje de arranque decía siempre
    // "http://localhost:3010" aunque el servidor escuchara en todas las
    // interfaces -- este test fija justo esa forma real de
    // os.networkInterfaces() (con loopback, una interfaz LAN y una
    // IPv6, que debe ignorarse).
    it('adds every non-internal IPv4 address, ignoring loopback and IPv6', () => {
        const interfaces = {
            lo: [{ address: '127.0.0.1', family: 'IPv4', internal: true } as any],
            wlp1s0: [
                { address: '192.168.1.151', family: 'IPv4', internal: false } as any,
                { address: 'fe80::1', family: 'IPv6', internal: false } as any,
            ],
        };

        expect(getListeningAddresses(3010, interfaces)).toEqual([
            'http://localhost:3010',
            'http://192.168.1.151:3010',
        ]);
    });

    it('lists every non-internal interface when there is more than one (e.g. Wi-Fi + Docker bridge)', () => {
        const interfaces = {
            wlp1s0: [{ address: '192.168.1.151', family: 'IPv4', internal: false } as any],
            'br-5a33b23ca322': [{ address: '172.18.0.1', family: 'IPv4', internal: false } as any],
        };

        expect(getListeningAddresses(3010, interfaces)).toEqual([
            'http://localhost:3010',
            'http://192.168.1.151:3010',
            'http://172.18.0.1:3010',
        ]);
    });
});
