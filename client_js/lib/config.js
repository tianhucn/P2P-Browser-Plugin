/**
 * Created by xieting on 2018/1/3.
 */


//时间单位统一为秒
let defaultP2PConfig = {
    key: 'free',                                //连接RP服务器的API key
    mode: 'live',                               //播放的流媒体类别，分为‘live‘和‘vod’两种，默认live

    wsSchedulerAddr: 'ws://10.21.100.172:8080/ws',            //调度服务器地址
    wsSignalerAddr: 'ws://120.78.168.126:8081/ws',          //信令服务器地址
    wsMaxRetries: 10,                           //发送数据重试时间间隔
    wsReconnectInterval: 5,                     //websocket重连时间间隔

    p2pEnabled: true,                           //是否开启P2P，默认true

    dcKeepAliveInterval: 10,                    //datachannel多少秒发送一次keep-alive信息
    dcKeepAliveAckTimeout: 2,                   //datachannel接收keep-alive-ack信息的超时时间，超时则认为连接失败并主动关闭
    dcRequestTimeout: 2,                        //datachannel接收二进制数据的超时时间

    packetSize: 16*1024,                        //每次通过datachannel发送的包的大小
    maxBufSize: 1024*1024*50,                   //p2p缓存的最大数据量
    loadTimeout: 5,                             //p2p下载的超时时间
    reportInterval: 60,                         //统计信息上报的时间间隔

    transitionEnabled: true,                    //是否允许节点自动跃迁
    transitionCheckInterval: 30,                //跃迁检查时间间隔
    transitionTTL: 2,                           //跃迁的最大跳数
    transitionWaitTime: 5,                      //跃迁等待Grant响应的时间

    defaultUploadBW: 1024*1024*4/8,             //总上行带宽默认4Mbps
    maxTransitionTries: 1,                      //最大跃迁次数（跃迁失败也算一次）
    maxGetParentsTries: 3,                      //获取父节点的最大尝试次数(不包含ws连上后的请求)

    defaultSubstreams: 2,                       //默认子流数量
};

export {defaultP2PConfig}
