import Vue from 'vue'
import Meeting from '@/views/meeting/index.vue'

jest.mock('@/views/meeting/components/Preview', () => ({}))
jest.mock('@/views/meeting/components/Chat', () => ({}))
jest.mock('@/api/websocketInfo', () => ({ getUrl: jest.fn() }))
jest.mock('@/store', () => ({ dispatch: jest.fn() }))

function stream() {
  const tracks = ['video', 'audio'].map(kind => ({ kind, enabled: true, stop: jest.fn() }))
  return {
    getTracks: () => tracks,
    getVideoTracks: () => tracks.filter(t => t.kind === 'video'),
    getAudioTracks: () => tracks.filter(t => t.kind === 'audio')
  }
}

function meeting() {
  const vm = new (Vue.extend(Meeting))()
  vm.$message = { error: jest.fn(), success: jest.fn() }
  vm.$refs.video_full = { srcObject: null }
  vm.clients[0].userId = '7'
  vm.clients[0].isSelf = true
  vm.clients[0].localStream = stream()
  vm.isInRoom = true
  vm.wsSend = jest.fn(() => true)
  return vm
}

describe('meeting regressions', () => {
  it('does not acquire media twice for duplicate success messages', async() => {
    const vm = meeting()
    vm.isInRoom = false
    vm.roomFromDate.nickname = 'tester'
    let acquired
    vm.startV = jest.fn(() => new Promise(resolve => { acquired = resolve }))
    const message = { userId: '7', roomId: '12345', message: 'enter' }
    const first = vm.successHandle(message)
    vm.successHandle(message)
    expect(vm.startV).toHaveBeenCalledTimes(1)
    acquired()
    await first
  })

  it('stops media acquired after the user has left', async() => {
    const vm = meeting()
    const media = stream()
    vm.roomFromDate.radio = '2'
    vm.createScreenStream = jest.fn(() => Promise.resolve(media))
    const pending = vm.startV()
    vm.leavingRoom = true
    await pending
    expect(media.getTracks().every(track => track.stop.mock.calls.length === 1)).toBe(true)
  })

  it('keeps participant IDs stable after removing a lower ID', () => {
    const vm = meeting()
    vm.$set(vm.clients, 2, { userId: '2', peerConnection: { close: jest.fn() } })
    vm.$set(vm.clients, 3, { userId: '3' })
    vm.kickHandle({ userId: '2' })
    expect(vm.clients[2]).toBeUndefined()
    expect(vm.clients[3].userId).toBe('3')
  })

  it('interprets BAN true as disabling chat, including self', () => {
    const vm = meeting()
    vm.banHandle({ userId: '7', message: 'true' })
    expect(vm.clients[0].chat).toBe(false)
    vm.sendChat('blocked')
    expect(vm.wsSend).not.toHaveBeenCalled()
    vm.banHandle({ userId: '7', message: 'false' })
    expect(vm.clients[0].chat).toBe(true)
  })

  it('disables outgoing tracks for all-member mute and video restrictions', () => {
    const vm = meeting()
    vm.mutedHandle({ userId: '', message: 'true' })
    vm.viewHandle({ userId: '', message: 'false' })
    expect(vm.clients[0].localStream.getTracks().every(t => !t.enabled)).toBe(true)
    vm.mutedHandle({ userId: '', message: 'false' })
    vm.viewHandle({ userId: '', message: 'true' })
    expect(vm.clients[0].localStream.getTracks().every(t => t.enabled)).toBe(true)
  })

  it('switches using the actual self ID and preserves media restrictions', async() => {
    const vm = meeting()
    const oldStream = vm.clients[0].localStream
    const replacement = stream()
    vm.clients[0].nowStream = 'camera'
    vm.clients[0].muted = true
    vm.clients[0].view = false
    vm.createScreenStream = jest.fn(() => Promise.resolve(replacement))
    vm.rebindLocalStream = jest.fn(() => Promise.resolve())
    await vm.changeStream('7')
    expect(vm.clients[0].localStream).toBe(replacement)
    expect(replacement.getTracks().every(t => !t.enabled)).toBe(true)
    expect(oldStream.getTracks()[0].stop).toHaveBeenCalled()
  })

  it('retains the old source when permission is denied', async() => {
    const vm = meeting()
    const oldStream = vm.clients[0].localStream
    vm.clients[0].nowStream = 'camera'
    vm.createScreenStream = jest.fn(() => Promise.reject(new Error('denied')))
    await vm.changeStream('7')
    expect(vm.clients[0].localStream).toBe(oldStream)
    expect(oldStream.getTracks()[0].stop).not.toHaveBeenCalled()
  })

  it('does not crash on malformed or null signaling messages', () => {
    const vm = meeting()
    for (const data of ['bad json', 'null', '[]']) {
      expect(() => vm.wseReceiveMessage({ data })).not.toThrow()
    }
  })

  it('preserves literal delimiter text in chat messages', () => {
    const vm = meeting()
    vm.wseReceiveMessage({ data: JSON.stringify({ command: 'chat', message: 'hello !@#' }) })
    expect(vm.receiveMsg).toContain('hello !@#')
  })

  it('cleans up every peer and local track on navigation', () => {
    const vm = meeting()
    const close = jest.fn()
    vm.$set(vm.clients, 2, { peerConnection: { close } })
    Meeting.beforeDestroy.call(vm)
    expect(close).toHaveBeenCalled()
    expect(vm.clients[0].localStream.getTracks()[0].stop).toHaveBeenCalled()
  })

  it('waits for remote SDP before creating an answer', async() => {
    const vm = meeting()
    let resolveRemote
    const pc = {
      setRemoteDescription: jest.fn(() => new Promise(resolve => { resolveRemote = resolve })),
      createAnswer: jest.fn(() => Promise.resolve({ type: 'answer', sdp: 'answer' })),
      setLocalDescription: jest.fn(() => Promise.resolve()),
      addIceCandidate: jest.fn(() => Promise.resolve())
    }
    vm.$set(vm.clients, 2, { userId: '2', peerConnection: pc })
    global.RTCSessionDescription = function(sdp) { return sdp }
    const answer = vm.offerHandle({ userId: '2', message: JSON.stringify({ type: 'offer', sdp: 'offer' }) })
    expect(pc.createAnswer).not.toHaveBeenCalled()
    resolveRemote()
    await answer
    expect(pc.createAnswer).toHaveBeenCalled()
    expect(vm.wsSend).toHaveBeenCalled()
  })

  it('queues ICE until a remote description is available', async() => {
    const vm = meeting()
    global.RTCIceCandidate = function(candidate) { return candidate }
    const pc = { remoteDescription: null, addIceCandidate: jest.fn(() => Promise.resolve()) }
    vm.$set(vm.clients, 2, { peerConnection: pc })
    await vm.candidateHandle({ userId: '2', message: '{"candidate":"candidate"}' })
    expect(pc.addIceCandidate).not.toHaveBeenCalled()
    pc.remoteDescription = { type: 'offer' }
    await vm.flushCandidates('2', pc)
    expect(pc.addIceCandidate).toHaveBeenCalled()
  })
})
