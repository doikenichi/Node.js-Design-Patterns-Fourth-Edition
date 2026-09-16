import assert from 'node:assert/strict'
import { suite, test } from 'node:test'
import { createApp } from './app.js'
import { DbClient } from './dbClient.js'
import { createTables } from './dbSetup.js'

async function withTestApp(testFn) {
  let db
  let app

  try {
    db = new DbClient(':memory:')
    await createTables(db)

    app = await createApp(db)
    await app.listen({ port: 0, host: '127.0.0.1' })

    const { port } = app.server.address()
    const baseUrl = `http://127.0.0.1:${port}`

    return await testFn({ app, db, baseUrl })
  } finally {
    await Promise.allSettled([app?.close(), db?.close()])
  }
}

suite('Booking integration tests', { concurrency: true }, () => {
  test('Reserving a seat works until full', async () => {
    await withTestApp(async fixture => {
      const createEventResponse = await fetch(`${fixture.baseUrl}/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Event 1', totalSeats: 2 }),
      })

      assert.equal(createEventResponse.status, 201)

      const eventData = await createEventResponse.json()
      const reserveUrl = `${fixture.baseUrl}/events/${eventData.eventId}/reservations`

      const res1 = await fetch(reserveUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: 'u1' }),
      })

      assert.equal(res1.status, 201)
      const reservation1 = await res1.json()
      assert.equal(reservation1.success, true)
      assert.equal(typeof reservation1.reservationId, 'string')

      const res2 = await fetch(reserveUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: 'u2' }),
      })
      assert.equal(res2.status, 201)
      const reservation2 = await res2.json()
      assert.equal(reservation2.success, true)
      assert.equal(typeof reservation2.reservationId, 'string')

      const res3 = await fetch(reserveUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: 'u3' }),
      })
      assert.equal(res3.status, 403)
      assert.deepEqual(await res3.json(), { error: 'Event is fully booked' })
    })
  })

  test('Returns 404 if event does not exist', async () => {
    await withTestApp(async ({ baseUrl }) => {
      const reserveUrl = `${baseUrl}/events/unknown/reservations`
      const res = await fetch(reserveUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: 'u1' }),
      })

      assert.equal(res.status, 404)
      assert.deepEqual(await res.json(), { error: 'Event not found' })
    })
  })
})
