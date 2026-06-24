import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { findBestPatient, verifyMetaSignature } from './index.ts'

Deno.test('findBestPatient - selects patient with matching DDD', () => {
  const candidates = [
    { id: '1', phone_mobile: '(11) 99999-8888', full_name: 'Gabriel SP' },
    { id: '2', phone_mobile: '(21) 99999-8888', full_name: 'Gabriel RJ' },
  ]
  
  // O telefone de entrada vem com DDI + DDD + número
  const incomingPhone = '5521999998888'
  const matched = findBestPatient(candidates, incomingPhone)
  
  assertEquals(matched?.id, '2')
  assertEquals(matched?.full_name, 'Gabriel RJ')
})

Deno.test('findBestPatient - falls back to first candidate if DDD cannot be matched', () => {
  const candidates = [
    { id: '1', phone_mobile: '(11) 99999-8888', full_name: 'Gabriel SP' },
    { id: '2', phone_mobile: '(31) 99999-8888', full_name: 'Gabriel MG' },
  ]
  
  const incomingPhone = '5541999998888' // DDD 41 não está nos candidatos
  const matched = findBestPatient(candidates, incomingPhone)
  
  assertEquals(matched?.id, '1')
})

Deno.test('findBestPatient - returns null if candidates array is empty', () => {
  const matched = findBestPatient([], '5511999998888')
  assertEquals(matched, null)
})

Deno.test('verifyMetaSignature - returns false for null signature', async () => {
  const payload = 'test_payload'
  const isValid = await verifyMetaSignature(payload, null, 'secret')
  assertEquals(isValid, false)
})

Deno.test('verifyMetaSignature - validates signature with correct app secret', async () => {
  const payload = 'hello_world'
  const appSecret = 'my_secret_key'
  
  // Assinatura gerada para "hello_world" com a chave "my_secret_key" usando HMAC SHA-256:
  // d3408f635c03c80ff636e2f1837920367cc017cc07ecab23dfc7855b5505f590
  const signatureHeader = 'sha256=d3408f635c03c80ff636e2f1837920367cc017cc07ecab23dfc7855b5505f590'
  
  const isValid = await verifyMetaSignature(payload, signatureHeader, appSecret)
  assertEquals(isValid, true)
})
