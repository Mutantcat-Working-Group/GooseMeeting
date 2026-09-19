<template>
  <div class="meeting-container">

    <el-container>
      <el-header height="214px">
        <template v-for="(client) in clients">
          <preview
            v-if="client!==undefined"
            :key="client.userId"
            :client="client"
            :is-room-admin="clients[0].isRoomAdmin"
            @banEvent="ban"
            @microEvent="changeMicro"
            @fullEvent="fullScreen"
            @kickEvent="kick"
            @viewEvent="changeView"
            @changeStreamEvent="changeStream"
          />
        </template>
      </el-header>
      <el-container>
        <el-main>
          <div style="text-align: center ;height: calc(100vh - 300px);width: 100%">
            <video ref="video_full" style="height:100%" muted autoplay playsinline />
          </div>
        </el-main>
        <el-aside width="350px">
          <Chat :receive-msg="receiveMsg" @chatEvent="sendChat" @noticeEvent="notice" />
          <div style="text-align: center;margin-top: 10px">
            <el-button v-if="clients[0].isRoomAdmin" type="danger" round size="mini" @click="changeView('')">
              <span v-show="isView">
                全体禁视
              </span>
              <span v-show="!isView">
                取消禁视
              </span>
            </el-button>
            <el-button v-if="clients[0].isRoomAdmin" type="danger" round size="mini" @click="changeMicro('')">
              <span v-show="!isMuted">
                全体禁音
              </span>
              <span v-show="isMuted">
                取消禁音
              </span></el-button>
            <el-button v-if="clients[0].isRoomAdmin" type="danger" round size="mini" @click="ban('')">
              <span v-show="!isBan">
                全体禁言
              </span>
              <span v-show="isBan">
                取消禁言
              </span></el-button>

          </div>
        </el-aside>
      </el-container>
    </el-container>

    <el-dialog title="请输入房间号和密码：" :visible.sync="dialogFormVisible" @close="closeView">
      <el-form ref="romeForm" :model="roomFromDate" status-icon :rules="roomFromRules" label-width="100px">
        <el-form-item label="昵称:" prop="nickname">
          <el-input v-model="roomFromDate.nickname" maxlength="20" autocomplete="off" />
        </el-form-item>
        <el-form-item label="房间号:" prop="roomId">
          <el-input v-model="roomFromDate.roomId" maxlength="10" autocomplete="off" />
        </el-form-item>
        <el-form-item label="密码:" prop="roomPw">
          <el-input v-model="roomFromDate.roomPw" type="password" maxlength="10" autocomplete="off" />
        </el-form-item>
        <el-form-item label="视频来源:" prop="radio">
          <el-radio v-model="roomFromDate.radio" label="1">摄像头</el-radio>
          <el-radio v-model="roomFromDate.radio" label="2">电脑屏幕</el-radio>
        </el-form-item>
        <el-form-item>
          <el-button @click="dialogFormVisible = false">取 消</el-button>
          <el-button type="primary" :disabled="!wsReady || joiningRoom" @click="createOrEnterRoom('enter')">加 入</el-button>
          <el-button type="primary" :disabled="!wsReady || joiningRoom" @click="createOrEnterRoom('create')">创 建</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import Preview from './components/Preview'
import Chat from './components/Chat'
import 'webrtc-adapter'
import { getUrl } from '@/api/websocketInfo'
import { mapGetters } from 'vuex'
import store from '@/store'
export default {
  name: 'Meeting',
  components: { Preview, Chat },
  data() {
    var valiRoomId = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请输入5-10位纯数字'))
      } else {
        var reg = /^\d{5,10}$/
        if (!reg.test(value)) {
          return callback(new Error('请输入5-10位纯数字'))
        }
        callback()
      }
    }
    return {
      meetingId: '0',
      dialogFormVisible: false,
      localWebsocket: undefined,
      wsUrl: undefined,
      wsReady: false,
      leavingRoom: false,
      receiveMsg: '',
      isInRoom: false,
      isBan: false,
      isView: true,
      isMuted: false,
      switchingStream: false,
      joiningRoom: false,
      startingMedia: false,
      pendingCandidates: {},
      fullScreenId: '',
      clients: [{
        userId: '0',
        nickname: '未连接',
        roomId: '0',
        localStream: undefined,
        peerConnection: undefined,
        muted: false,
        view: true,
        chat: true,
        isSelf: false,
        isRoomAdmin: false,
        nowStream: 'screen'
      }],
      roomFromDate: {
        nickname: '',
        roomId: '',
        roomPw: '',
        radio: '2'
      },
      roomFromRules: {
        roomId: [
          { validator: valiRoomId, trigger: 'blur' }
        ],
        roomPw: [
          { validator: valiRoomId, trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    ...mapGetters([
      'token',
      'name'
    ])
  },
  async mounted() {
    this.dialogFormVisible = true
    this.roomFromDate.nickname = this.name
    try {
      await this.initLocalWebsocket()
    } catch (e) {
      console.log('websocket错误:' + e.message)
      this.$message.error('网络连接错误!')
      this.closeView()
    }
  },
  beforeDestroy() {
    this.leavingRoom = true
    if (this.isInRoom) {
      const msg = new MessageModel(TYPE_COMMAND_KICK, this.roomFromDate.roomId, '', this.clients[0].userId)
      this.wsSend(msg)
    }
    this.isInRoom = false
    this.cleanupRoom()
    this.closeLocalWebsocket()
  },

  methods: {
    // 设置本地播放器
    async startV() {
      const isScreen = this.roomFromDate.radio === '2'
      const mediaStream = isScreen
        ? await this.createScreenStream()
        : await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      if (this.leavingRoom) {
        mediaStream.getTracks().forEach(track => track.stop())
        return
      }
      const c0 = {
        userId: '0',
        roomId: '0',
        nickname: '未连接',
        localStream: mediaStream,
        peerConnection: undefined,
        muted: false,
        view: true,
        chat: true,
        isSelf: true,
        isRoomAdmin: false,
        nowStream: isScreen ? 'screen' : 'camera'
      }
      this.$set(this.clients, 0, c0)
    },
    async createScreenStream() {
      const screenStream = await navigator.mediaDevices.getDisplayMedia(screenConstraints)
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        const audioTrack = audioStream.getAudioTracks()[0]
        if (audioTrack) {
          screenStream.addTrack(audioTrack)
        }
      } catch (error) {
        // 没有麦克风时仍然允许只共享画面
        console.log('获取麦克风失败:' + error.message)
      }
      return screenStream
    },
    stopV() {
      const stream = this.clients[0] && this.clients[0].localStream
      if (stream) {
        stream.getTracks().forEach(function(track) {
          track.stop()
        })
      }
    },
    async changeStream(userId) {
      if (String(userId) !== String(this.clients[0].userId) || !this.isInRoom || this.switchingStream) return
      this.switchingStream = true
      try {
        const isScreen = this.clients[0].nowStream === 'screen'
        // 先拿到新流，再停掉旧流，避免切换失败后本地画面丢流
        const mediaStream = isScreen
          ? await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          : await this.createScreenStream()
        if (this.leavingRoom) {
          mediaStream.getTracks().forEach(track => track.stop())
          return
        }
        mediaStream.getAudioTracks().forEach(track => { track.enabled = !this.clients[0].muted })
        mediaStream.getVideoTracks().forEach(track => { track.enabled = this.clients[0].view })
        const oldStream = this.clients[0].localStream
        if (oldStream) {
          oldStream.getTracks().forEach(function(track) {
            track.stop()
          })
        }
        this.clients[0].localStream = mediaStream
        this.clients[0].nowStream = isScreen ? 'camera' : 'screen'
        if (this.fullScreenId === '0') this.$refs.video_full.srcObject = mediaStream
        await this.rebindLocalStream(mediaStream)
      } catch (error) {
        this.$message.error('切换视频源失败: ' + (error.message || '未知错误'))
      } finally {
        this.switchingStream = false
      }
    },
    async rebindLocalStream(stream) {
      // 本地媒体流变化后，把新轨道替换到所有已建立的连接上并重新协商
      for (const key of Object.keys(this.clients)) {
        const client = this.clients[key]
        if (!client || client.isSelf || !client.peerConnection) continue
        const pc = client.peerConnection
        let needsNegotiation = false
        const newKinds = stream.getTracks().map(track => track.kind)
        pc.getSenders().forEach(sender => {
          if (sender.track && newKinds.indexOf(sender.track.kind) === -1) {
            pc.removeTrack(sender)
            needsNegotiation = true
          }
        })
        for (const track of stream.getTracks()) {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === track.kind)
          if (sender) {
            try {
              await sender.replaceTrack(track)
            } catch (error) {
              pc.removeTrack(sender)
              pc.addTrack(track, stream)
              needsNegotiation = true
            }
          } else {
            pc.addTrack(track, stream)
            needsNegotiation = true
          }
        }
        if (needsNegotiation) await this.negotiatePeerConnection(pc, client.userId)
      }
    },
    negotiatePeerConnection(pc, userId) {
      if (this.leavingRoom) return
      return pc.createOffer(offerOptions).then(description => {
        return pc.setLocalDescription(description).then(() => {
          const msg = new MessageModel(TYPE_COMMAND_OFFER, this.clients[0].roomId, this.messageDateToString(description), userId, this.clients[0].nickname, this.clients[0].isRoomAdmin)
          this.wsSend(msg)
        })
      }).catch(error => {
        console.log('重新协商失败:' + error.message)
      })
    },
    ban(userId) {
      console.log('ban:' + userId)
      if (userId === '') { // 全体禁言
        if (this.isBan) { // 恢复
          const msg = new MessageModel(TYPE_COMMAND_BAN, this.roomFromDate.roomId, 'false', '')
          this.wsSend(msg)
        } else {
          // 全体禁言
          const msg = new MessageModel(TYPE_COMMAND_BAN, this.roomFromDate.roomId, 'true', '')
          this.wsSend(msg)
        }
      } else {
        const client = this.clients[Number(userId)]
        if (!client) return
        if (client.chat) { // 全员发送chat关闭
          const msg = new MessageModel(TYPE_COMMAND_BAN, this.roomFromDate.roomId, 'true', userId)
          this.wsSend(msg)
        } else { // 全员发送chat开启
          const msg = new MessageModel(TYPE_COMMAND_BAN, this.roomFromDate.roomId, 'false', userId)
          this.wsSend(msg)
        }
      }
    },
    changeMicro(userId) {
      console.log('changeMicro:' + userId)
      if (userId === '') {
        if (this.isMuted) {
          const msg = new MessageModel(TYPE_COMMAND_MUTED, this.roomFromDate.roomId, 'false', '')
          this.wsSend(msg)
        } else {
          const msg = new MessageModel(TYPE_COMMAND_MUTED, this.roomFromDate.roomId, 'true', '')
          this.wsSend(msg)
        }
      } else {
        const client = this.clients[Number(userId)]
        if (userId === this.clients[0].userId) { // 自己开关麦克风，通知所有人
          if (this.clients[0].muted) {
            // 打开麦克风
            const msg = new MessageModel(TYPE_COMMAND_MUTED, this.roomFromDate.roomId, 'false', this.clients[0].userId)
            this.wsSend(msg)
          } else {
            // 关闭麦克风
            const msg = new MessageModel(TYPE_COMMAND_MUTED, this.roomFromDate.roomId, 'true', this.clients[0].userId)
            this.wsSend(msg)
          }
        } else { // 别人
          if (this.clients[0].isRoomAdmin) { // 自己是管理员，就要彻底开关他的麦克风
            if (!client) return
            if (client.muted) {
              // 通知所有人打开此人麦克风
              const msg = new MessageModel(TYPE_COMMAND_MUTED, this.roomFromDate.roomId, 'false', userId)
              this.wsSend(msg)
            } else {
              // 通知所有人关闭此人麦克风
              const msg = new MessageModel(TYPE_COMMAND_MUTED, this.roomFromDate.roomId, 'true', userId)
              this.wsSend(msg)
            }
          } else {
            if (client && client.muted) {
              client.muted = false
            } else {
              if (client) {
                client.muted = true
              }
            }
          }
        }
      }
    },
    fullScreen(userId) {
      console.log('fullScreen:' + userId)
      const stream = userId === this.clients[0].userId
        ? this.clients[0].localStream
        : this.clients[Number(userId)] && this.clients[Number(userId)].localStream
      if (stream) {
        this.$refs.video_full.srcObject = stream
        this.fullScreenId = userId === this.clients[0].userId ? '0' : userId
      }
    },
    kick(userId) {
      console.log('kick:' + userId)
      const msg = new MessageModel(TYPE_COMMAND_KICK, this.roomFromDate.roomId, '', userId)
      this.wsSend(msg)
    },
    changeView(userId) {
      console.log('changeView:' + userId)
      if (userId === '') {
        if (this.isView) {
          const msg = new MessageModel(TYPE_COMMAND_VIEW, this.roomFromDate.roomId, 'false', '')
          this.wsSend(msg)
        } else {
          const msg = new MessageModel(TYPE_COMMAND_VIEW, this.roomFromDate.roomId, 'true', '')
          this.wsSend(msg)
        }
      } else {
        const client = this.clients[Number(userId)]
        if (userId === this.clients[0].userId) { // 自己开关视频，通知所有人
          if (this.clients[0].view) {
            // 打开视频
            const msg = new MessageModel(TYPE_COMMAND_VIEW, this.roomFromDate.roomId, 'false', this.clients[0].userId)
            this.wsSend(msg)
          } else {
            // 关闭视频
            const msg = new MessageModel(TYPE_COMMAND_VIEW, this.roomFromDate.roomId, 'true', this.clients[0].userId)
            this.wsSend(msg)
          }
        } else { // 别人
          if (this.clients[0].isRoomAdmin) { // 自己是管理员，就要彻底开关他的视频
            if (!client) return
            if (client.view) {
              // 通知所有人打开此人视频
              const msg = new MessageModel(TYPE_COMMAND_VIEW, this.roomFromDate.roomId, 'false', userId)
              this.wsSend(msg)
            } else {
              // 通知所有人关闭此人视频
              const msg = new MessageModel(TYPE_COMMAND_VIEW, this.roomFromDate.roomId, 'true', userId)
              this.wsSend(msg)
            }
          } else {
            if (client && client.view) {
              client.view = false
              if (this.fullScreenId === userId) {
                this.$refs.video_full.srcObject = null
              }
            } else {
              if (client) {
                client.view = true
              }
            }
          }
        }
      }
    },
    notice(msg) {
      if (msg && String(msg).trim()) {
        this.sendChat('【通知】' + msg)
      }
    },
    sendChat(msg) {
      if (!this.clients[0].chat) {
        this.$message.error('已被禁言...')
        return
      }
      const text = String(msg || '').trim()
      if (!text) return
      const nickname = this.clients[0].nickname || this.name
      msg = new MessageModel(TYPE_COMMAND_CHAT, this.roomFromDate.roomId, nickname + ': ' + text + '\n')
      this.wsSend(msg)
    },
    createOrEnterRoom(method) { // 进入房间
      if (this.joiningRoom || this.leavingRoom) return
      this.$refs.romeForm.validate((valid) => {
        if (valid) {
          if (!this.wsReady || !this.localWebsocket || this.localWebsocket.readyState !== WebSocket.OPEN) {
            this.$message.error('正在连接服务器，请稍候...')
            return
          }
          var msg
          this.joiningRoom = true
          if (method === 'create') {
            msg = new MessageModel(TYPE_COMMAND_ROOM_CREATE, this.roomFromDate.roomId, this.roomFromDate.nickname, '', this.roomFromDate.roomPw, this.token)
            this.wsSend(msg)
          } else {
            msg = new MessageModel(TYPE_COMMAND_ROOM_ENTER, this.roomFromDate.roomId, this.roomFromDate.nickname, '', this.roomFromDate.roomPw, this.token)
            this.wsSend(msg)
          }
        } else {
          console.log('表单验证错误')
          return false
        }
      })
    },
    successHandle(message) {
      if (this.isInRoom || this.leavingRoom || this.startingMedia) return
      this.startingMedia = true
      store.dispatch('user/setNickname', this.roomFromDate.nickname)
      const nickname = String(this.roomFromDate.nickname || '').trim() || this.name
      return this.startV().then(() => {
        if (this.leavingRoom) return
        this.isInRoom = true
        this.dialogFormVisible = false
        this.clients[0].userId = message.userId
        this.clients[0].roomId = message.roomId
        this.clients[0].nickname = nickname
        if (message.message === 'create') {
          this.clients[0].isRoomAdmin = true
        }
        // 广播 自己准备好了,其他用户收到后就会创建连接
        var msg = new MessageModel(TYPE_COMMAND_READY, this.roomFromDate.roomId, nickname, message.userId, '', this.clients[0].isRoomAdmin)
        this.wsSend(msg)
        this.$message.success('成功!')
      }).catch(error => {
        this.$message.error('获取媒体失败: ' + (error && error.message ? error.message : '未知错误'))
        this.wsSend(new MessageModel(TYPE_COMMAND_KICK, message.roomId, '', message.userId))
        this.closeView()
      }).finally(() => {
        this.joiningRoom = false
        this.startingMedia = false
      })
    },
    readyHandle(message) { // 收到上线的用户准备好信号，创建RTCPeerConnectio准备与他连接并发送offer
      if (!this.clients[0].localStream || this.clients[0].userId === message.userId) { // 是自己准备好了
        return
      }
      const existing = this.clients[Number(message.userId)]
      if (existing && existing.peerConnection) {
        existing.peerConnection.close()
      }
      const rtcPeerConnection = new RTCPeerConnection(iceServers)
      rtcPeerConnection.userId = message.userId
      for (const track of this.clients[0].localStream.getTracks()) {
        rtcPeerConnection.addTrack(track, this.clients[0].localStream)
      }
      rtcPeerConnection.ontrack = this.onTrack
      rtcPeerConnection.onicecandidate = this.onIceCandidate
      const remoteClient = {
        userId: message.userId,
        roomId: message.roomId,
        nickname: message.message,
        localStream: undefined,
        peerConnection: rtcPeerConnection,
        muted: false,
        view: true,
        chat: true,
        isSelf: false,
        isRoomAdmin: safeParseBoolean(message.token, false),
        nowStream: 'screen'
      }
      this.$set(this.clients, Number(message.userId), remoteClient)
      this.negotiatePeerConnection(rtcPeerConnection, message.userId)
    },
    async offerHandle(message) {
      if (!this.clients[0].localStream) {
        return
      }
      let sdp
      try {
        sdp = parseSignalPayload(message.message)
      } catch (error) {
        console.log('offer解析失败:' + error.message)
        return
      }
      const client = this.clients[Number(message.userId)]
      const rtcPeerConnection = client && client.peerConnection
        ? client.peerConnection
        : new RTCPeerConnection(iceServers)
      if (!client || !client.peerConnection) {
        rtcPeerConnection.userId = message.userId
        for (const track of this.clients[0].localStream.getTracks()) {
          rtcPeerConnection.addTrack(track, this.clients[0].localStream)
        }
        rtcPeerConnection.ontrack = this.onTrack
        rtcPeerConnection.onicecandidate = this.onIceCandidate
        const remoteClient = {
          userId: message.userId,
          roomId: message.roomId,
          nickname: message.roomPw,
          localStream: undefined,
          peerConnection: rtcPeerConnection,
          muted: false,
          view: true,
          chat: true,
          isSelf: false,
          isRoomAdmin: safeParseBoolean(message.token, false),
          nowStream: 'screen'
        }
        this.$set(this.clients, Number(message.userId), remoteClient)
      } else if (message.roomPw && client.nickname !== message.roomPw) {
        client.nickname = message.roomPw
      }
      try {
        await rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
        await this.flushCandidates(message.userId, rtcPeerConnection)
        const description = await rtcPeerConnection.createAnswer()
        await rtcPeerConnection.setLocalDescription(description)
        const msg = new MessageModel(TYPE_COMMAND_ANSWER, this.clients[0].roomId, this.messageDateToString(description), message.userId)
        this.wsSend(msg)
      } catch (error) {
        console.log('处理offer失败:' + error.message)
      }
    },
    answerHandle(message) {
      const client = this.clients[Number(message.userId)]
      if (!client || !client.peerConnection) {
        console.log('收到answer但没有对应连接:' + message.userId)
        return
      }
      let sdp
      try {
        sdp = parseSignalPayload(message.message)
      } catch (error) {
        console.log('answer解析失败:' + error.message)
        return
      }
      return client.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp)).then(() => {
        return this.flushCandidates(message.userId, client.peerConnection)
      }).catch(error => {
        console.log('设置answer描述失败:' + error.message)
      })
    },
    onIceCandidate(event) {
      if (event.candidate === null) {
        return
      }
      var msg = new MessageModel(TYPE_COMMAND_CANDIDATE, this.clients[0].roomId, this.messageDateToString(event.candidate), event.target.userId)
      this.wsSend(msg)
    },
    async candidateHandle(message) {
      const client = this.clients[Number(message.userId)]
      try {
        const candidate = new RTCIceCandidate(parseSignalPayload(message.message))
        if (!client || !client.peerConnection || !client.peerConnection.remoteDescription) {
          const queue = this.pendingCandidates[message.userId] || []
          queue.push(candidate)
          this.pendingCandidates[message.userId] = queue
          return
        }
        await client.peerConnection.addIceCandidate(candidate)
      } catch (error) {
        console.log('candidate解析失败:' + error.message)
      }
    },
    async flushCandidates(userId, pc) {
      const queue = this.pendingCandidates[userId] || []
      delete this.pendingCandidates[userId]
      for (const candidate of queue) {
        try {
          await pc.addIceCandidate(candidate)
        } catch (error) {
          console.log('添加candidate失败:' + error.message)
        }
      }
    },
    onTrack(event) {
      const client = this.clients[Number(event.target.userId)]
      if (!client) return
      client.localStream = event.streams[0]
    },
    closeView() {
      if (!this.isInRoom && !this.leavingRoom) {
        this.leavingRoom = true
        this.cleanupRoom()
        this.closeLocalWebsocket()
        this.$router.go(-1)
      }
    },
    async initLocalWebsocket() {
      console.log('初始化weosocket')
      const response = await getUrl()
      if (this.leavingRoom) return
      this.wsUrl = response.data
      console.log('获取到wsurl:' + this.wsUrl)
      this.localWebsocket = new WebSocket(this.wsUrl)
      this.localWebsocket.onmessage = this.wseReceiveMessage
      this.localWebsocket.onopen = () => {
        console.log('localWebsocket打开')
        this.wsReady = true
      }
      this.localWebsocket.onerror = () => {
        console.log('localWebsocket错误')
      }
      this.localWebsocket.onclose = (e) => {
        console.log('localWebsocket关闭' + e)
        this.wsReady = false
        if (this.leavingRoom) {
          return
        }
        this.$message.error('网络连接断开')
        this.leavingRoom = true
        this.isInRoom = false
        this.cleanupRoom()
        this.$router.go(-1)
      }
    },
    wseReceiveMessage(e) { // 数据接收
      if (this.leavingRoom) return
      let message
      try {
        message = JSON.parse(e.data)
        if (!message || typeof message !== 'object' || Array.isArray(message)) return
        if (message.userId !== undefined) message.userId = String(message.userId)
      } catch (error) {
        console.log('消息解析失败:' + error.message)
        return
      }
      switch (message.command) {
        case TYPE_COMMAND_SUCCESS:
          this.successHandle(message)
          break
        case TYPE_COMMAND_ERROR:
          this.joiningRoom = false
          this.$message.error(message.message)
          break
        case TYPE_COMMAND_CHAT:
          this.receiveMsg += String(message.message || '')
          break
        case TYPE_COMMAND_READY:
          this.readyHandle(message)
          break
        case TYPE_COMMAND_OFFER:
          this.offerHandle(message)
          break
        case TYPE_COMMAND_ANSWER:
          this.answerHandle(message)
          break
        case TYPE_COMMAND_CANDIDATE:
          this.candidateHandle(message)
          break
        case TYPE_COMMAND_VIEW:
          this.viewHandle(message)
          break
        case TYPE_COMMAND_MUTED:
          this.mutedHandle(message)
          break
        case TYPE_COMMAND_BAN:
          this.banHandle(message)
          break
        case TYPE_COMMAND_KICK:
          this.kickHandle(message)
          break
      }
    },
    viewHandle(message) {
      if (message.userId === '') {
        if (message.message === 'true') {
          // 全体开启视频
          this.isView = true
          this.clients.forEach(c => {
            if (c !== undefined && !c.isRoomAdmin) {
              c.view = true
              if (c.isSelf) this.syncLocalTracks()
            }
          })
        } else {
          // 全体关闭视频
          if (this.fullScreenId !== '0') {
            this.$refs.video_full.srcObject = null
          }
          this.isView = false
          this.clients.forEach(c => {
            if (c !== undefined && !c.isRoomAdmin) {
              c.view = false
              if (c.isSelf) this.syncLocalTracks()
              if (c.isSelf && this.fullScreenId === '0') this.$refs.video_full.srcObject = null
            }
          })
        }
      } else {
        if (message.userId === this.clients[0].userId) {
          const enabled = message.message === 'true'
          this.clients[0].view = enabled
          if (this.clients[0].localStream) {
            this.clients[0].localStream.getVideoTracks().forEach(track => {
              track.enabled = enabled
            })
          }
          if (!enabled && this.fullScreenId === '0') {
            this.$refs.video_full.srcObject = null
          }
        } else {
          const client = this.clients[Number(message.userId)]
          if (!client) return
          client.view = message.message === 'true'
          if (!client.view && this.fullScreenId === message.userId) {
            this.$refs.video_full.srcObject = null
          }
        }
      }
    },
    mutedHandle(message) {
      if (message.userId === '') {
        if (message.message === 'true') {
          // 全体静音
          this.isMuted = true
          this.clients.forEach(c => {
            if (c !== undefined && !c.isRoomAdmin) {
              c.muted = true
              if (c.isSelf) this.syncLocalTracks()
            }
          })
        } else {
          // 全体取消静音
          this.isMuted = false
          this.clients.forEach(c => {
            if (c !== undefined && !c.isRoomAdmin) {
              c.muted = false
              if (c.isSelf) this.syncLocalTracks()
            }
          })
        }
      } else {
        if (message.userId === this.clients[0].userId) {
          const enabled = message.message !== 'true'
          this.clients[0].muted = !enabled
          if (this.clients[0].localStream) {
            this.clients[0].localStream.getAudioTracks().forEach(track => {
              track.enabled = enabled
            })
          }
        } else {
          const client = this.clients[Number(message.userId)]
          if (client) {
            client.muted = message.message === 'true'
          }
        }
      }
    }, banHandle(message) {
      if (message.userId === '') {
        if (message.message === 'true') {
          // 全体禁言
          this.isBan = true
          this.clients.forEach(c => {
            if (c !== undefined && !c.isRoomAdmin) {
              c.chat = false
            }
          })
        } else {
          // 全体取消禁言
          this.isBan = false
          this.clients.forEach(c => {
            if (c !== undefined && !c.isRoomAdmin) {
              c.chat = true
            }
          })
        }
      } else {
        if (message.userId === this.clients[0].userId) {
          this.clients[0].chat = message.message !== 'true'
        } else {
          const client = this.clients[Number(message.userId)]
          if (client) {
            client.chat = message.message !== 'true'
          }
        }
      }
    }, kickHandle(message) {
      if (message.userId === this.clients[0].userId) {
        this.$message.error('您被踢出会议!')
        this.leavingRoom = true
        this.isInRoom = false
        this.dialogFormVisible = false
        this.cleanupRoom()
        this.closeLocalWebsocket()
        if (this.$route && this.$route.name === 'Meeting') {
          this.$router.go(-1)
        }
        return
      }
      const key = Number(message.userId)
      const client = this.clients[key]
      if (client && client.peerConnection) {
        client.peerConnection.close()
      }
      // The array is indexed by user ID; splice (including Vue.$delete) shifts IDs.
      this.$set(this.clients, key, undefined)
      delete this.pendingCandidates[message.userId]
      if (this.fullScreenId === message.userId) {
        this.$refs.video_full.srcObject = null
        this.fullScreenId = ''
      }
    },
    wsSend(data) { // 数据发送
      if (!this.localWebsocket || this.localWebsocket.readyState !== WebSocket.OPEN) {
        console.log('websocket未连接，发送失败')
        return false
      }
      this.localWebsocket.send(JSON.stringify(data))
      return true
    },
    cleanupRoom() {
      Object.keys(this.clients).forEach(key => {
        const client = this.clients[key]
        if (client && client.peerConnection) {
          client.peerConnection.close()
          client.peerConnection = undefined
        }
      })
      this.stopV()
      this.pendingCandidates = {}
      if (this.$refs.video_full) this.$refs.video_full.srcObject = null
    },
    syncLocalTracks() {
      const client = this.clients[0]
      if (!client.localStream) return
      client.localStream.getAudioTracks().forEach(track => { track.enabled = !client.muted })
      client.localStream.getVideoTracks().forEach(track => { track.enabled = client.view })
    },
    closeLocalWebsocket() {
      if (this.localWebsocket) {
        this.localWebsocket.onopen = null
        this.localWebsocket.onmessage = null
        this.localWebsocket.onclose = null
        this.localWebsocket.onerror = null
        this.localWebsocket.close()
        this.localWebsocket = undefined
      }
      this.wsReady = false
    },
    messageDateToString(data) { // 如果message字段是对象，就把他变成字符串，这样服务器解析不会报错
      return '!@#' + JSON.stringify(data) + '!@#'
    }

  }

}

class MessageModel {
  constructor(command, roomId, message, userId, roomPw, token) {
    this.command = command
    this.userId = userId
    this.roomId = roomId
    this.message = message
    this.roomPw = roomPw
    this.token = token
  }
}

function safeParseBoolean(value, fallback = false) {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return fallback
}

function parseSignalPayload(value) {
  if (typeof value !== 'string') return value
  const payload = value.startsWith('!@#') && value.endsWith('!@#') ? value.slice(3, -3) : value
  return JSON.parse(payload)
}

const TYPE_COMMAND_ROOM_ENTER = 'enterRoom'
const TYPE_COMMAND_ROOM_CREATE = 'createRoom'
const TYPE_COMMAND_READY = 'ready'
const TYPE_COMMAND_OFFER = 'offer'
const TYPE_COMMAND_ANSWER = 'answer'
const TYPE_COMMAND_CANDIDATE = 'candidate'

const TYPE_COMMAND_ERROR = 'error'
const TYPE_COMMAND_SUCCESS = 'success'
const TYPE_COMMAND_CHAT = 'chat'

const TYPE_COMMAND_MUTED = 'MUTED'
const TYPE_COMMAND_VIEW = 'VIEW'
const TYPE_COMMAND_BAN = 'BAN'
const TYPE_COMMAND_KICK = 'KICK'

// const TYPE_COMMAND_SIGN = 'SIGN'

const iceServers = {
  'iceServers': [
    { urls: 'stun:stun.ekiga.net' },
    { urls: 'stun:stun.ideasip.com' }
  ]
}
const offerOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
}
const screenConstraints = {
  audio: false,
  video: true
}
</script>

<style lang="scss" scoped>
.el-header {
  background-color: #B3C0D1;
  padding: 0;
  margin: 0;
  overflow-x: scroll;
  overflow-y: hidden;
  white-space: nowrap;
}

.el-aside {
  background-color: #D3DCE6;
  margin: 0;
  padding-top: 8px;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 20px;
}

.el-main {
  background-color: #E9EEF3;

  padding: 0;
}

.el-container {
  height: calc(100vh - 84px)
}

</style>
