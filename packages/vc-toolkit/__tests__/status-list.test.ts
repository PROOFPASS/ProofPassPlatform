/**
 * Tests para W3C Status List 2021 Implementation
 * Coverage objetivo: 100%
 */

import * as statusList from '../src/status-list';

describe('Status List 2021', () => {
  describe('createStatusList', () => {
    it('debe crear una status list con tamaño por defecto', () => {
      const list = statusList.createStatusList();

      expect(list).toBeInstanceOf(Uint8Array);
      expect(list.length).toBe(Math.ceil(131072 / 8)); // 16384 bytes
    });

    it('debe crear una status list con tamaño custom', () => {
      const list = statusList.createStatusList(1000);

      expect(list.length).toBe(Math.ceil(1000 / 8)); // 125 bytes
    });

    it('debe inicializar todos los bits en 0', () => {
      const list = statusList.createStatusList(100);

      for (let i = 0; i < 100; i++) {
        expect(statusList.getStatus(list, i)).toBe(false);
      }
    });
  });

  describe('setStatus y getStatus', () => {
    let list: Uint8Array;

    beforeEach(() => {
      list = statusList.createStatusList(1000);
    });

    it('debe setear status a true (revoked)', () => {
      const updated = statusList.setStatus(list, 0, true);

      expect(statusList.getStatus(updated, 0)).toBe(true);
    });

    it('debe setear status a false (active)', () => {
      let updated = statusList.setStatus(list, 0, true);
      updated = statusList.setStatus(updated, 0, false);

      expect(statusList.getStatus(updated, 0)).toBe(false);
    });

    it('debe setear múltiples índices independientemente', () => {
      let updated = list;
      updated = statusList.setStatus(updated, 5, true);
      updated = statusList.setStatus(updated, 10, true);
      updated = statusList.setStatus(updated, 15, true);

      expect(statusList.getStatus(updated, 5)).toBe(true);
      expect(statusList.getStatus(updated, 10)).toBe(true);
      expect(statusList.getStatus(updated, 15)).toBe(true);
      expect(statusList.getStatus(updated, 6)).toBe(false);
      expect(statusList.getStatus(updated, 11)).toBe(false);
    });

    it('debe lanzar error si el índice está fuera de límites en setStatus', () => {
      expect(() => {
        statusList.setStatus(list, 10000, true);
      }).toThrow('Index 10000 out of bounds');
    });

    it('debe lanzar error si el índice está fuera de límites en getStatus', () => {
      expect(() => {
        statusList.getStatus(list, 10000);
      }).toThrow('Index 10000 out of bounds');
    });

    it('debe no mutar la lista original', () => {
      const original = statusList.createStatusList(100);
      const updated = statusList.setStatus(original, 5, true);

      expect(statusList.getStatus(original, 5)).toBe(false);
      expect(statusList.getStatus(updated, 5)).toBe(true);
    });
  });

  describe('encodeStatusList y decodeStatusList', () => {
    it('debe comprimir y descomprimir correctamente', () => {
      const list = statusList.createStatusList(1000);
      let updated = list;
      updated = statusList.setStatus(updated, 0, true);
      updated = statusList.setStatus(updated, 10, true);
      updated = statusList.setStatus(updated, 100, true);

      const encoded = statusList.encodeStatusList(updated);
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);

      const decoded = statusList.decodeStatusList(encoded);
      expect(decoded).toEqual(updated);
    });

    it('debe producir string base64 válido', () => {
      const list = statusList.createStatusList(100);
      const encoded = statusList.encodeStatusList(list);

      expect(encoded).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('debe comprimir eficientemente', () => {
      const list = statusList.createStatusList(131072); // 16KB sin comprimir
      const encoded = statusList.encodeStatusList(list);
      const encodedSize = Buffer.from(encoded, 'base64').length;

      // La compresión debe reducir significativamente el tamaño
      expect(encodedSize).toBeLessThan(list.length);
    });
  });

  describe('createStatusListCredential', () => {
    it('debe crear un credential válido', () => {
      const list = statusList.createStatusList(100);
      const credential = statusList.createStatusListCredential(
        'https://example.com/status/1',
        'did:example:issuer',
        list
      );

      expect(credential['@context']).toContain('https://www.w3.org/2018/credentials/v1');
      expect(credential['@context']).toContain('https://w3id.org/vc/status-list/2021/v1');
      expect(credential.id).toBe('https://example.com/status/1');
      expect(credential.type).toContain('VerifiableCredential');
      expect(credential.type).toContain('StatusList2021Credential');
      expect(credential.issuer).toBe('did:example:issuer');
      expect(credential.credentialSubject.type).toBe('StatusList2021');
      expect(credential.credentialSubject.statusPurpose).toBe('revocation');
    });

    it('debe incluir encodedList comprimido', () => {
      const list = statusList.createStatusList(100);
      const credential = statusList.createStatusListCredential(
        'https://example.com/status/1',
        'did:example:issuer',
        list
      );

      expect(credential.credentialSubject.encodedList).toBeTruthy();
      expect(typeof credential.credentialSubject.encodedList).toBe('string');
    });

    it('debe soportar statusPurpose suspension', () => {
      const list = statusList.createStatusList(100);
      const credential = statusList.createStatusListCredential(
        'https://example.com/status/1',
        'did:example:issuer',
        list,
        'suspension'
      );

      expect(credential.credentialSubject.statusPurpose).toBe('suspension');
    });

    it('debe incluir issuanceDate', () => {
      const list = statusList.createStatusList(100);
      const credential = statusList.createStatusListCredential(
        'https://example.com/status/1',
        'did:example:issuer',
        list
      );

      expect(credential.issuanceDate).toBeTruthy();
      expect(new Date(credential.issuanceDate).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('checkCredentialStatus', () => {
    it('debe verificar status de credential correctamente', () => {
      let list = statusList.createStatusList(100);
      list = statusList.setStatus(list, 42, true);

      const credential = statusList.createStatusListCredential(
        'https://example.com/status/1',
        'did:example:issuer',
        list
      );

      expect(statusList.checkCredentialStatus(credential, 42)).toBe(true);
      expect(statusList.checkCredentialStatus(credential, 41)).toBe(false);
    });
  });

  describe('createCredentialStatus', () => {
    it('debe crear un credentialStatus object válido', () => {
      const credStatus = statusList.createCredentialStatus(
        'https://example.com/status/1',
        42
      );

      expect(credStatus.id).toBe('https://example.com/status/1#42');
      expect(credStatus.type).toBe('StatusList2021Entry');
      expect(credStatus.statusPurpose).toBe('revocation');
      expect(credStatus.statusListIndex).toBe('42');
      expect(credStatus.statusListCredential).toBe('https://example.com/status/1');
    });

    it('debe soportar purpose suspension', () => {
      const credStatus = statusList.createCredentialStatus(
        'https://example.com/status/1',
        42,
        'suspension'
      );

      expect(credStatus.statusPurpose).toBe('suspension');
    });
  });

  describe('revokeCredential y unrevokeCredential', () => {
    let list: Uint8Array;

    beforeEach(() => {
      list = statusList.createStatusList(100);
    });

    it('debe revocar un credential', () => {
      const revoked = statusList.revokeCredential(list, 10);

      expect(statusList.getStatus(revoked, 10)).toBe(true);
    });

    it('debe unrevoke un credential', () => {
      const revoked = statusList.revokeCredential(list, 10);
      const unrevoked = statusList.unrevokeCredential(revoked, 10);

      expect(statusList.getStatus(unrevoked, 10)).toBe(false);
    });
  });

  describe('getStatusListStats', () => {
    it('debe retornar estadísticas correctas para lista vacía', () => {
      // createStatusList(100) creates 13 bytes (ceil(100/8)), so 104 bits
      const list = statusList.createStatusList(100);
      const stats = statusList.getStatusListStats(list);

      expect(stats.totalSlots).toBe(104); // Rounded up to byte boundary
      expect(stats.revokedCount).toBe(0);
      expect(stats.activeCount).toBe(104);
      expect(stats.utilizationPercent).toBe(0);
    });

    it('debe retornar estadísticas correctas con algunos revocados', () => {
      // createStatusList(100) creates 13 bytes (ceil(100/8)), so 104 bits
      let list = statusList.createStatusList(100);
      list = statusList.setStatus(list, 0, true);
      list = statusList.setStatus(list, 10, true);
      list = statusList.setStatus(list, 20, true);

      const stats = statusList.getStatusListStats(list);

      expect(stats.totalSlots).toBe(104); // Rounded up to byte boundary
      expect(stats.revokedCount).toBe(3);
      expect(stats.activeCount).toBe(101);
      expect(stats.utilizationPercent).toBeCloseTo(2.88, 1); // 3/104 * 100
    });

    it('debe retornar 100% cuando todos están revocados', () => {
      // createStatusList(16) creates 2 bytes, so 16 bits (use 16 for exact byte boundary)
      let list = statusList.createStatusList(16);
      for (let i = 0; i < 16; i++) {
        list = statusList.setStatus(list, i, true);
      }

      const stats = statusList.getStatusListStats(list);

      expect(stats.revokedCount).toBe(16);
      expect(stats.activeCount).toBe(0);
      expect(stats.utilizationPercent).toBe(100);
    });
  });

  describe('Flujo end-to-end completo', () => {
    it('debe completar flujo de revocación completo', () => {
      // 1. Create status list
      let list = statusList.createStatusList(1000);

      // 2. Revoke some credentials
      list = statusList.revokeCredential(list, 42);
      list = statusList.revokeCredential(list, 100);
      list = statusList.revokeCredential(list, 500);

      // 3. Create status list credential
      const credential = statusList.createStatusListCredential(
        'https://example.com/status/1',
        'did:example:issuer',
        list
      );

      // 4. Check statuses
      expect(statusList.checkCredentialStatus(credential, 42)).toBe(true);
      expect(statusList.checkCredentialStatus(credential, 100)).toBe(true);
      expect(statusList.checkCredentialStatus(credential, 500)).toBe(true);
      expect(statusList.checkCredentialStatus(credential, 43)).toBe(false);

      // 5. Get stats
      const stats = statusList.getStatusListStats(list);
      expect(stats.revokedCount).toBe(3);
      expect(stats.activeCount).toBe(997);
    });

    it('debe manejar encode/decode en flujo completo', () => {
      // Create and populate list
      let list = statusList.createStatusList(500);
      list = statusList.setStatus(list, 10, true);
      list = statusList.setStatus(list, 50, true);

      // Encode
      const encoded = statusList.encodeStatusList(list);

      // Decode
      const decoded = statusList.decodeStatusList(encoded);

      // Verify
      expect(statusList.getStatus(decoded, 10)).toBe(true);
      expect(statusList.getStatus(decoded, 50)).toBe(true);
      expect(statusList.getStatus(decoded, 11)).toBe(false);
    });
  });
});
