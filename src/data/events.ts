import type { EventDef } from './schema';

/** 随机事件池。新增事件加在这个数组里即可，记得 id 不要和已有的重复。 */
export const EVENTS: EventDef[] = [
  {
    id: 'bus_card',
    title: '公交卡',
    locationId: 'street',
    text: '车站椅子上躺着一张公交卡，背面用圆珠笔写着一个电话。余额你试了一下，还有一点。',
    choices: [
      { text: '留着坐车', effects: { money: 15 }, result: '你把它和自己的卡别在一起。电话没打。' },
      { text: '打回去还给他', effects: { mood: 6 }, result: '对方愣了两秒，说了谢谢，又问你在哪个站。' },
    ],
  },
  {
    id: 'spilled',
    title: '洒了',
    locationId: 'street',
    speaker: '保安',
    text: '外卖袋在电梯里破了，汤淌到脚边。保安看着你，拖把就在他手里。',
    choices: [
      { text: '蹲下去擦', effects: { mood: -2, stamina: -4 }, result: '汤是咸的。鞋也是。' },
      { text: '说不是自己的', effects: { mood: -6 }, result: '电梯门关上的时候，你看见他摇头。' },
      { text: '买瓶水给保洁', effects: { money: -12, mood: 2 }, result: '保洁阿姨说不用，还是把水留下了。' },
    ],
  },
  {
    id: 'wage_late',
    title: '晚到的日结',
    locationId: 'site',
    text: '群里说今天的钱明天一起结。已经有人在骂，也有人已经把安全帽摘了。',
    choices: [
      { text: '跟着问一句', effects: { money: 20, mood: -2 }, result: '多出来的二十像是打发。你还是收下了。' },
      { text: '先走', effects: { mood: -4 }, result: '明天的事明天再说。这句话今天特别空。' },
    ],
  },
  {
    id: 'cold',
    title: '嗓子',
    locationId: 'room',
    text: '早上起来嗓子像砂纸。药箱是空的，只剩一张过期的创可贴。',
    choices: [
      { text: '去药店', effects: { money: -40, stamina: 8, mood: 2 }, result: '药是苦的。至少晚上能躺平。' },
      { text: '硬扛', effects: { stamina: -12, mood: -4 }, result: '你喝了两杯热水，把今天的班扛了过去。' },
    ],
  },
  {
    id: 'borrow_phone',
    title: '借手机',
    locationId: 'street',
    text: '一个陌生人说手机没电了，要借你的打一个电话。眼神比较急，包倒是新的。',
    choices: [
      { text: '把手机递过去', effects: { money: -30, mood: -6 }, result: '电话打完他道了谢。你的付款码页面却自己亮了一下。' },
      { text: '指给他便利店', effects: { mood: 1 }, result: '他哦了一声，往店里走。你没回头。' },
    ],
  },
  {
    id: 'expired_meal',
    title: '临期',
    locationId: 'shop',
    text: '货架尽头贴着买一送一，日期印的是今天。饭团被冰得邦硬。',
    choices: [
      { text: '买下来', effects: { money: -12, hunger: 16, mood: 1 }, result: '一个现在吃，一个塞进包里。' },
      { text: '算了', result: '你从它前面走过去，像没看见。' },
    ],
  },
  {
    id: 'phone_bill',
    title: '停机',
    locationId: 'room',
    text: '手机突然只能接电话，不能上网。话费在一个你没注意的晚上用完了。',
    choices: [
      { text: '先充三十', effects: { money: -30, mood: 2 }, result: '信号条回来的时候，未读消息跟着回来了。' },
      { text: '先这样', effects: { mood: -6 }, result: '世界小了一圈。安静倒是真的。' },
    ],
  },
  {
    id: 'rain',
    title: '雨',
    locationId: 'street',
    text: '雨没有任何预告。你的包开始变深色，传单或者饭盒，总得有一个先遭殃。',
    choices: [
      { text: '买一把伞', effects: { money: -15, mood: 2 }, result: '伞骨有点歪。至少头是干的。' },
      { text: '跑回去', effects: { stamina: -8, mood: -3 }, result: '到楼下的时候，你像刚从池子里上来。' },
    ],
  },
  {
    id: 'unpaid_ot',
    title: '再半小时',
    locationId: 'site',
    text: '收工铃响了。包工头说再搬半小时，钱明天算。天已经开始往橙里走。',
    choices: [
      { text: '再干', effects: { stamina: -10, money: 40, mood: -3 }, result: '半小时比钟上的长。钱倒是今天就塞到了你手里。' },
      { text: '下班', effects: { mood: 2 }, result: '你把安全帽挂回去。背后有人继续骂，也有人跟着你走。' },
    ],
  },
  {
    id: 'job_ad',
    title: '招工',
    locationId: 'street',
    text: '电线杆上的招工，工资写得像笑话，地址却很近。纸边被雨泡起了一层毛。',
    choices: [
      { text: '走过去看一眼', effects: { mood: -2, stamina: -2 }, result: '门是锁的。电话打过去，是空号。' },
      { text: '拍张照就走', effects: { mood: 1 }, result: '你后来也没再打开那张照片。' },
    ],
  },
  {
    id: 'broken_bike',
    title: '单车',
    locationId: 'street',
    text: '锁开了，车铃响了，轮子不转。下一辆车在两个路口外，地图上显示还有电。',
    choices: [
      { text: '走路过去', effects: { stamina: -8 }, result: '两个路口比看起来远。' },
      { text: '再扫一辆', effects: { money: -4 }, result: '新的这辆会响，也会走。' },
    ],
  },
  {
    id: 'upstairs',
    title: '楼上',
    locationId: 'room',
    text: '楼上从上午就开始钻墙。你的桌子跟着抖，杯子里的水画出一圈圈细纹。',
    choices: [
      { text: '上去说', effects: { mood: -4 }, result: '对方开了条门缝，说再有一小时。' },
      { text: '出去躲躲', effects: { stamina: -3, mood: 1 }, result: '楼道里反而安静。你在台阶上坐到手机发烫。' },
    ],
  },
  {
    id: 'soy',
    title: '涨了一块',
    locationId: 'eatery',
    text: '常买的豆浆涨了一块。老板娘说豆子贵了，眼睛没看你，看的是锅。',
    choices: [
      { text: '照旧买', effects: { money: -8, hunger: 8 }, result: '味道没变。价格变了这件事，粥本身不管。' },
      { text: '今天不喝', effects: { hunger: -2, mood: -2 }, result: '你空着手走出那条巷子。' },
    ],
  },
  {
    id: 'scraped',
    title: '蹭到',
    locationId: 'street',
    text: '电瓶车蹭过你的胳膊，人停了一下，看你准备怎么反应。车筐里还有两袋菜。',
    choices: [
      { text: '让他走', effects: { mood: -4 }, result: '车尾灯远了。胳膊上的印还在。' },
      { text: '让他赔点', effects: { money: 30, mood: -2 }, result: '他掏出三十，嘴上不干不净，手倒是快。' },
      { text: '对骂两句', effects: { mood: -8 }, result: '围观的人很快散了。谁也没赢。' },
    ],
  },
  {
    id: 'lottery',
    title: '保底五元',
    locationId: 'street',
    text: '「扫码保底五元」。摊主的手机壳磨白了，笑容很新。',
    choices: [
      { text: '扫一下', effects: { mood: -3 }, result: '页面转了三秒，说谢谢参与。五元没有出现。' },
      { text: '绕开', effects: { mood: 1 }, result: '你从摊位外侧过去。喇叭还在循环。' },
    ],
  },
  {
    id: 'reunion',
    title: '人均一百二',
    locationId: 'room',
    text: '旧同学在群里 @所有人，周六聚餐，人均一百二。定位在你坐车要四十分钟的地方。',
    choices: [
      { text: '去', effects: { money: -80, mood: 10 }, result: '菜是好吃的。有人问你现在做什么，你说还那样。' },
      { text: '说要加班', effects: { mood: -4 }, result: '群里回了个表情。没人再问。' },
      { text: '已读不回', effects: { mood: -2 }, result: '消息往上顶。你的名字安静地留在列表里。' },
    ],
  },
  {
    id: 'half_day',
    title: '材料没到',
    locationId: 'site',
    text: '下午的材料没到，工地空了半边。有人已经找阴凉坐下，安全帽扣在脸上。',
    choices: [
      { text: '一起坐着', effects: { stamina: 10, mood: 2 }, result: '没人说话。风从没装玻璃的窗口穿过去。' },
      { text: '去附近再找一单', effects: { stamina: -6, money: 50 }, result: '隔壁工地要人卸沙。五十分钟，五十块。' },
    ],
  },
  {
    id: 'badge',
    title: '工牌',
    locationId: 'site',
    text: '地上一张工牌。照片里的人你见过，名字已经被鞋底磨没了。',
    choices: [
      { text: '交到门卫', effects: { mood: 4 }, result: '门卫说又是他，随手丢进一个纸盒。' },
      { text: '放回原地', effects: { mood: 1 }, result: '你把它挪到不会被踩到的砖上。' },
    ],
  },
  {
    id: 'mom_call',
    title: '家里的电话',
    locationId: 'room',
    speaker: '家里',
    text: '家里来电话，问你吃得好不好，钱够不够。你看着余额，背景音是他们家的电视。',
    choices: [
      { text: '说都好', effects: { mood: -3 }, result: '她信了，或者假装信了。电话不久就挂了。' },
      { text: '说有点紧', effects: { mood: 4, money: 80 }, result: '她沉默了一下，转来八十块。备注只有一个字：饭。' },
      { text: '等会儿再打', effects: { mood: -2 }, result: '你把电话扣下。后来也没有再打回去。' },
    ],
  },
  {
    id: 'health_card',
    title: '健康证',
    locationId: 'shop',
    text: '店长说明天开始查健康证。你没有。办证要花钱，也要排一下午的队。',
    choices: [
      { text: '去办', effects: { money: -60, stamina: -6, mood: -2 }, result: '队很长，窗口很短。证倒是拿到了。' },
      { text: '再说', effects: { mood: -5 }, result: '你把这件事先放到明天的明天。' },
    ],
  },
  {
    id: 'stair_dark',
    title: '楼道灯',
    locationId: 'room',
    text: '楼道灯又灭了。六楼，手机电量十四。楼梯的转角你闭着眼也该认得。',
    choices: [
      { text: '摸黑上去', effects: { stamina: -4, mood: -2 }, result: '你踢到一次自己的门槛。' },
      { text: '借手电再送回去', effects: { stamina: -6, mood: 2 }, result: '一楼的人把应急灯塞给你，说用完放回来就行。' },
    ],
  },
  {
    id: 'wedding',
    title: '红包',
    locationId: 'street',
    text: '工友结婚，红包群已经开始滚动。你跟他不算熟，但你的名字在里面，像一张没法退的票。',
    choices: [
      { text: '随五十', effects: { money: -50, mood: 2 }, result: '群里跳出来一行谢谢。很快被下一行盖住。' },
      { text: '随二十', effects: { money: -20 }, result: '不多。至少你出现过。' },
      { text: '不随', effects: { mood: -6 }, result: '你退出页面。名字还在群里，红包记录里没有你。' },
    ],
  },
  {
    id: 'heat',
    title: '地面发白',
    locationId: 'site',
    text: '中午的地面发白。有人被扶到阴影里，水桶空了，桶底只剩热乎乎的塑料味。',
    choices: [
      { text: '买一箱水', effects: { money: -24, mood: 4, stamina: 4 }, result: '水很快没了。至少那个人坐下了。' },
      { text: '把自己的水分出去', effects: { stamina: -4, mood: 3 }, result: '你的瓶子轻了。嗓子还在。' },
      { text: '先顾自己', effects: { mood: -4, stamina: -2 }, result: '你躲到板房后面，把最后一口水喝完。' },
    ],
  },
  {
    id: 'bad_review',
    title: '差评',
    locationId: 'street',
    text: '外卖软件弹了一条差评：汤洒了。你记得那单，你是扶着楼梯扶手爬上去的。',
    choices: [
      { text: '申诉', effects: { mood: -3 }, result: '系统说已记录。没有然后。' },
      { text: '认了', effects: { mood: -6 }, result: '星级掉了一点。你把手机扣过去。' },
      { text: '给顾客补一份', effects: { money: -18, mood: 2 }, result: '对方回了个句号。差评还在，你心里松了一点。' },
    ],
  },
  {
    id: 'missing_cash',
    title: '对不上',
    locationId: 'room',
    text: '口袋比早上轻。你把今天的账单对了一遍，还是对不上，少了四十。房间里没有第二个人。',
    choices: [
      { text: '再翻一遍', effects: { stamina: -2, mood: -4 }, result: '床底、口袋、袋子。没有。' },
      { text: '算了', effects: { mood: -6 }, result: '四十块买不到一个答案。你把它从今天划掉。' },
    ],
  },
  {
    id: 'last_bus',
    title: '末班',
    locationId: 'street',
    text: '末班车的尾灯在路口灭了。你还差三站。路灯好的那一段很短。',
    choices: [
      { text: '走回去', effects: { stamina: -12, mood: -3 }, result: '三站路，你走成了一次小小的搬家。' },
      { text: '打车', effects: { money: -28, stamina: 2 }, result: '司机没说话。计价器跳得比你心跳诚实。' },
    ],
  },
  {
    id: 'night_snack',
    title: '我请',
    locationId: 'street',
    speaker: '工友',
    text: '一个工友敲你肩膀：「烧烤，我请。你只出自己那瓶酒。」炭已经红了。',
    choices: [
      { text: '去', effects: { money: -15, mood: 8, hunger: 10, stamina: -4 }, result: '串是他请的。酒是你的。话不多，但热。' },
      { text: '回屋睡', effects: { mood: 1 }, result: '你摆摆手。背后的烟火气送了你半条街。' },
    ],
  },
  {
    id: 'fine_print',
    title: '门缝里的单子',
    locationId: 'room',
    text: '一张单子从门缝塞进来，条款很密，最后一行空着等签字。你没看见是谁塞的。',
    choices: [
      { text: '不签', effects: { mood: 2 }, result: '你把它叠好，压在水壶底下。后来也没人来取。' },
      { text: '签了再说', effects: { mood: -8, money: -40 }, result: '你没看完。第二天发现那是一张没必要的会员。' },
    ],
  },
  {
    id: 'ac_drip',
    title: '滴了一夜',
    locationId: 'room',
    text: '隔壁空调的水，一夜之间把纸箱泡软了。纸箱里是你仅有的备用衣服。',
    choices: [
      { text: '白天去敲门', effects: { mood: -2, money: 20 }, result: '对方道歉，塞给你二十块，说去洗衣店。不够，但人还算像样。' },
      { text: '把床挪开', effects: { mood: -3 }, result: '水还在滴。至少不再滴进衣服里。' },
    ],
  },
  {
    id: 'glass_ad',
    title: '月入过万',
    locationId: 'street',
    text: '地铁玻璃上贴着「月入过万，无需经验」。反光里，你的脸叠在那行字上。',
    choices: [
      { text: '站着看完', effects: { mood: -6 }, result: '下面还有一行小字，地址模糊，像故意的。' },
      { text: '把眼睛挪开', effects: { mood: 2 }, result: '车来了。玻璃上的字留在玻璃上。' },
    ],
  },
  {
    id: 'masks',
    title: '口罩',
    locationId: 'shop',
    text: '灰大。你的口罩已经洗得发硬，戴上像一块小木板。',
    choices: [
      { text: '买一包', effects: { money: -10, mood: 2, stamina: 2 }, result: '新的那只很轻。你把旧的扔进店门口的桶。' },
      { text: '再凑合', effects: { stamina: -4, mood: -2 }, result: '你把旧口罩翻了个面。并没有什么区别。' },
    ],
  },
  {
    id: 'survey',
    title: '五分钟',
    locationId: 'street',
    text: '路口有人拦问卷，说五分钟，送一瓶水。夹板上面已经有很多字，看不出真假。',
    choices: [
      { text: '做', effects: { hunger: 4, stamina: -4, mood: -1 }, result: '水是温的。问题很傻。五分钟是真的。' },
      { text: '摇头走', effects: { mood: 1 }, result: '对方立刻去拦下一个人，熟练得像呼吸。' },
    ],
  },
  {
    id: 'blackout',
    title: '停电',
    locationId: 'room',
    text: '整层楼忽然黑了。冰箱响了一声，停了。窗外别的楼还亮着，像跟你们无关。',
    choices: [
      { text: '早点睡', effects: { stamina: 8, mood: -2, hunger: -4 }, result: '黑暗里时间走得慢。你还是睡着了。' },
      { text: '下楼透气', effects: { stamina: -4, mood: 2 }, result: '一楼有人打着手电打牌。你看了一会儿，没加入。' },
    ],
  },
  {
    id: 'sole',
    title: '鞋底',
    locationId: 'street',
    text: '鞋底在井盖上裂开。走路开始一歪一歪。修鞋摊还没收，锥子在灯下闪了一下。',
    choices: [
      { text: '去修', effects: { money: -15, mood: 2 }, result: '老师傅两分钟搞定。他说这鞋还能再骗你一个月。' },
      { text: '将就', effects: { stamina: -6, mood: -3 }, result: '每一步都提醒你，地面是硬的。' },
    ],
  },
  {
    id: 'collection_sms',
    title: '短信',
    locationId: 'room',
    text: '催收短信又来了，措辞比上周更短。像是懒得吓唬你，只是把日子又念了一遍。',
    choices: [
      { text: '读完', effects: { mood: -8 }, result: '你把每个字都看了。一个字也没有变轻。' },
      { text: '删掉', effects: { mood: -4 }, result: '短信没了。还款日还在。' },
      { text: '先还一百', effects: { money: -100, mood: 6 }, result: '数字小了一点点。你知道这不叫还清，但今晚能睡。' },
    ],
  },
  {
    id: 'coins',
    title: '托盘里的硬币',
    locationId: 'street',
    text: '自动售货机把没人拿的硬币吐在托盘里，灯一闪一闪，像在等一个不讲究的人。',
    choices: [
      { text: '拿走', effects: { money: 8 }, result: '八块。你没找到失主，因为本来就没有。' },
      { text: '留在那儿', effects: { mood: 3 }, result: '你走了两步又觉得自己可笑。硬币还在。' },
    ],
  },
];

export const FALLBACK_EVENT: EventDef = {
  id: 'quiet_day',
  uncapped: true,
  title: '没什么事',
  locationId: 'room',
  text: '这一天平淡得有点假。你等了一会儿，城市没有理你。',
  choices: [{ text: '继续过', result: '日子照走。' }],
};
