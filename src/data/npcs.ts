import { ENDING } from './endings';
import type { NpcDef } from './schema';

export const NPCS: NpcDef[] = [
  {
    id: 'lin',
    name: '小林',
    role: '室友',
    beats: [
      {
        id: 'lin-1',
        title: '半夜的面',
        locationId: 'room',
        minDay: 1,
        minAffinity: 0,
        text: '灯还亮着。小林蹲在小电锅旁边，水开了，他头也没抬：「还有一包。你吃不吃？」锅边糊着干涸的汤渍。',
        choices: [
          { text: '坐下一起吃', effects: { hunger: 12, mood: 6 }, affinity: 1, result: '两个人分一包面，谁也没说味道。' },
          { text: '说自己吃过了', effects: { mood: -1 }, result: '他哦了一声，把面捞进自己碗里。' },
        ],
      },
      {
        id: 'lin-2',
        title: '工资条',
        locationId: 'room',
        minDay: 5,
        minAffinity: 1,
        text: '小林把手机屏幕转过来，又很快收回去。「这个月比上个月少四百。你说，这座城市是不是专吃这种钱？」',
        choices: [
          { text: '再撑一撑就回本', effects: { mood: 2 }, result: '他说「也是」，没再往下讲。' },
          { text: '不值，但人还在', effects: { mood: 4 }, affinity: 1, result: '他笑了一下，笑得有点短。' },
        ],
      },
      {
        id: 'lin-3',
        title: '押金',
        locationId: 'room',
        minDay: 10,
        minAffinity: 1,
        text: '小林在门口站了很久才开口。中介的押金黄了，他差两百周转，问你能不能先垫上。「下个月发了就还。」',
        choices: [
          { text: '先垫给他', effects: { money: -200, mood: 2 }, affinity: 2, result: '他把欠条写在外卖单背面，字很用力。' },
          { text: '这次真没有', effects: { mood: -3 }, affinity: -1, result: '他点点头，说知道了，把门带上。' },
        ],
      },
      {
        id: 'lin-4',
        title: '老乡的招工',
        locationId: 'room',
        minDay: 16,
        minAffinity: 2,
        text: '小林收到一张外地招工，包住，工资写得很满。「我自己也没底。你帮我看一眼，这像不像真的？」',
        choices: [
          { text: '让他问清楚再动', effects: { mood: 1 }, affinity: 1, result: '他保存了那条消息，没立刻回。' },
          { text: '这种数字别信', effects: { mood: 2 }, result: '他把屏幕按灭。「我也这么觉得。」' },
        ],
      },
      {
        id: 'lin-5',
        title: '末班夜车',
        locationId: 'room',
        minDay: 22,
        minAffinity: 3,
        text: '行李箱立在门口。小林买了两张站票，一张是他自己的，另一张空着名字。「债可以留在这儿。人也可以。车是今晚的。」',
        choices: [
          { text: '上车', affinity: 1, endingId: ENDING.leave, result: '你把钥匙留在桌上。' },
          { text: '我留下', effects: { mood: -2 }, affinity: -1, flagsAdd: ['stayed'], result: '他看了你一眼，没再劝。车门在楼下响了一声。' },
        ],
      },
    ],
  },
  {
    id: 'zhou',
    name: '老周',
    role: '工友',
    beats: [
      {
        id: 'zhou-1',
        title: '手套',
        locationId: 'site',
        minDay: 2,
        minAffinity: 0,
        requiresFlag: 'worked_brick',
        text: '工地角落，老周把一副磨白的手套扔过来。「新来的别用手去接钢筋。我见过太多次。」',
        choices: [
          { text: '道谢，戴上', effects: { mood: 3, stamina: 2 }, affinity: 1, result: '手套大了一号，但手稳了。' },
          { text: '说自己有分寸', effects: { mood: -1 }, result: '他耸耸肩，不再看你。' },
        ],
      },
      {
        id: 'zhou-2',
        title: '烟歇',
        locationId: 'site',
        minDay: 7,
        minAffinity: 1,
        text: '老周蹲在没完工的楼梯上，烟没点着。「包工头报人数的时候会少报一个。你要是不盯，那个人就是你。」',
        choices: [
          { text: '把工时记下来', effects: { mood: -2 }, affinity: 1, result: '你把当天的工时写进备忘录。' },
          { text: '当他吓你', effects: { mood: 1 }, affinity: -1, result: '他没生气，只说随你。' },
        ],
      },
      {
        id: 'zhou-3',
        title: '少了一截',
        locationId: 'site',
        minDay: 13,
        minAffinity: 1,
        text: '发日结的时候，老周数了两遍，把你的那份也翻过来。确实少了四十。「你要去问，我站你旁边。你要不问，这钱就没了。」',
        choices: [
          { text: '去问', effects: { money: 40, mood: -2 }, affinity: 1, result: '包工头骂骂咧咧，还是补上了。' },
          { text: '算了', effects: { mood: -6 }, result: '老周把钱递给你，没再说。' },
        ],
      },
      {
        id: 'zhou-4',
        title: '谁来喊人',
        locationId: 'site',
        minDay: 18,
        minAffinity: 2,
        text: '老周的腰不好。他靠着钢管说话。「上面想找个能喊得动人的。不是升官，是多挨骂，多一点钱。你要是搬够了，可以顶我半天。」',
        choices: [
          { text: '我可以试试', effects: { mood: 2 }, affinity: 1, flagsAdd: ['zhou_recommend'], result: '他点头。那你先把今天的砖码齐。' },
          { text: '我还是搬我的', result: '他说行，各过各的。' },
        ],
      },
      {
        id: 'zhou-5',
        title: '手套还你',
        locationId: 'site',
        minDay: 24,
        minAffinity: 2,
        text: '老周要回老家一趟，箱子已经捆好。他把那副手套又放回你手里。「城留在这儿，人不用一次留全。班上的人还认这副手套。」',
        choices: [
          { text: '收下，继续干', effects: { mood: 6, money: 80 }, affinity: 1, result: '手套里夹着八十块。他说是上次多出来的。' },
          { text: '让他带走', effects: { mood: 2 }, result: '他最终还是把手套留在了钢管上。' },
        ],
      },
    ],
  },
  {
    id: 'chen',
    name: '陈姐',
    role: '房东',
    beats: [
      {
        id: 'chen-1',
        title: '这个月的租',
        locationId: 'room',
        minDay: 6,
        scheduleDay: 6,
        minAffinity: 0,
        text: '陈姐站在楼道里，手里一把钥匙转得响。「四百五。我不是银行，但我也不是亲戚。」',
        choices: [
          { text: '把房租交上', effects: { money: -450 }, affinity: 1, result: '她点完钱，钥匙不转了。' },
          { text: '再缓两天', effects: { mood: -6 }, affinity: -1, flagsAdd: ['rent_late'], result: '她看了你一眼。「两天。我记着。」' },
        ],
      },
      {
        id: 'chen-2',
        title: '看房',
        locationId: 'room',
        minDay: 12,
        scheduleDay: 12,
        minAffinity: 0,
        text: '陈姐说看看水管，眼睛却在数你的插座。「电费下回单算。房间还行，别再往墙上钉东西。」',
        choices: [
          { text: '给她倒杯水', effects: { mood: 1 }, affinity: 1, result: '她没喝完，但语气松了一点。' },
          { text: '说自己要出门', effects: { mood: -2 }, affinity: -1, result: '她嗯了一声，在本子上写了什么。' },
        ],
      },
      {
        id: 'chen-3',
        title: '漏水',
        locationId: 'room',
        minDay: 18,
        scheduleDay: 18,
        minAffinity: 0,
        text: '天花板的水滴正好砸在枕头上。陈姐上来看了看，说师傅下午才到。「你要是能干，就先把桶放好，我少算你一点。不能干，就先挪床。」',
        choices: [
          { text: '自己先接着', effects: { stamina: -10, money: 80 }, affinity: 2, result: '你垫了管子。她少算了八十，算你辛苦费。' },
          { text: '只把床挪开', effects: { mood: -2 }, result: '水还在滴，离枕头远了点。' },
        ],
      },
      {
        id: 'chen-4',
        title: '门口',
        locationId: 'room',
        minDay: 24,
        scheduleDay: 24,
        minAffinity: 0,
        text: '又到了日子。陈姐在门口，语气看不出来。「这个月还是四百五。你要是上次拖过，我得把那两天也算进去。」',
        choices: [
          {
            text: '一次算清',
            effects: { money: -450 },
            effectsIf: [{ flag: 'rent_late', effects: { money: -80 } }],
            affinity: 1,
            result: '她把本子翻过一页。',
          },
          { text: '先这样吧', effects: { mood: -14, stamina: -6 }, affinity: -1, result: '她没再数钱，只是把你看了很久。你知道那不是放过。' },
        ],
      },
      {
        id: 'chen-5',
        title: '三十号之前',
        locationId: 'room',
        minDay: 29,
        scheduleDay: 29,
        minAffinity: 0,
        text: '陈姐把一袋剩菜放在你门口，又像是顺手放的。「我不管你欠外面多少。这间房，三十号晚上之前别出事。出事了我还得收拾。」',
        choices: [
          { text: '道谢', effects: { mood: 8, hunger: 8 }, affinity: 1, result: '菜还温着。你没问她为什么做多了。' },
          { text: '说你会把房间留好', effects: { mood: -2 }, result: '她摆摆手，下楼了。' },
        ],
      },
    ],
  },
  {
    id: 'wang',
    name: '王大爷',
    role: '街头',
    beats: [
      {
        id: 'wang-1',
        title: '同一张板凳',
        locationId: 'street',
        minDay: 3,
        minAffinity: 0,
        text: '街口的板凳上坐着王大爷，瓜子壳堆成一小圈。他往旁边挪了挪，没问你是谁。「坐一会儿又不花钱。站着的人看起来都赶时间。」',
        choices: [
          { text: '坐下', effects: { mood: 6, stamina: 4 }, affinity: 1, result: '瓜子推过来。你推回去一半。' },
          { text: '说还得赶路', effects: { mood: -1 }, result: '他不拦你，继续磕他的。' },
        ],
      },
      {
        id: 'wang-2',
        title: '旧厂',
        locationId: 'street',
        minDay: 8,
        minAffinity: 1,
        text: '王大爷指着马路对面已经封起来的大门。「那儿以前发月饼，过年发一箱。现在门上贴着出租。月饼没了，广告还在。」',
        choices: [
          { text: '听他说完', effects: { mood: 4 }, affinity: 1, result: '故事不长，他讲得很慢。' },
          { text: '说自己没见过', result: '他点头。正常。你们来的时候门已经锁了。' },
        ],
      },
      {
        id: 'wang-3',
        title: '看手',
        locationId: 'street',
        minDay: 14,
        minAffinity: 1,
        text: '他看了看你的手。「这不是写字的手。也不是完全认命的手。你欠着东西吧？欠着就欠着，别欠到饭上。」',
        choices: [
          { text: '承认', effects: { mood: 3 }, affinity: 1, result: '他没追问数目。' },
          { text: '把话题岔开', effects: { mood: -2 }, result: '他哦了一声，把瓜子袋换了个手。' },
        ],
      },
      {
        id: 'wang-4',
        title: '一个号码',
        locationId: 'street',
        minDay: 20,
        minAffinity: 2,
        text: '王大爷递过一张折了两次的纸，上面一个电话。「我以前的徒弟，现在在市场看仓库。不是发财的路。是少受一点冻的路。你要不要，随你。」',
        choices: [
          { text: '收下', effects: { mood: 3, money: 60 }, affinity: 1, flagsAdd: ['warehouse_number'], result: '你下午去看了一眼。对方塞给你六十块搬运费，没留你。' },
          { text: '还给他', effects: { mood: 1 }, result: '他把纸收回口袋，像早就猜到。' },
        ],
      },
      {
        id: 'wang-5',
        title: '板凳还在',
        locationId: 'street',
        minDay: 26,
        minAffinity: 3,
        text: '太阳把两个人的影子叠得很短。王大爷拍拍身边的位置。「债是真的。肚子也是真的。你要是今天不想去任何地方，这椅子没人收费。」',
        choices: [
          { text: '坐下，今天不去了', affinity: 1, endingId: ENDING.bench, result: '你把手机扣在腿上。' },
          { text: '还得去还那笔钱', effects: { mood: 5 }, affinity: 1, result: '他往里挪了挪，给你留了下次的位置。' },
        ],
      },
    ],
  },
  {
    id: 'arui',
    name: '阿蕊',
    role: '店员',
    beats: [
      {
        id: 'arui-1',
        title: '同一碗面',
        locationId: 'shop',
        minDay: 4,
        minAffinity: 0,
        text: '便利店灯管嗡嗡响。阿蕊把面碗转了个方向，让热气对着你。「你每次都这个点来。夜班的人我认得完。」',
        choices: [
          { text: '笑一下', effects: { mood: 4 }, affinity: 1, result: '她也笑，笑完就去扫码了。' },
          { text: '只点头', result: '交易完成，谁也没多话。' },
        ],
      },
      {
        id: 'arui-2',
        title: '临期',
        locationId: 'shop',
        minDay: 9,
        minAffinity: 1,
        text: '阿蕊从柜台底下拿出一盒临期饭团。「系统要我扔掉。扔掉也可惜。你要是不嫌，就当没看见。」',
        choices: [
          { text: '拿走', effects: { hunger: 14, mood: 2 }, affinity: 1, result: '饭团是冷的，但是完整的一顿。' },
          { text: '让她按规矩处理', effects: { mood: 1 }, result: '她耸肩，还是放回了柜台底下。' },
        ],
      },
      {
        id: 'arui-3',
        title: '替班',
        locationId: 'shop',
        minDay: 15,
        minAffinity: 1,
        text: '「我明天要去办证。店长说找不到人就扣我全勤。你要是下午能来站四个钟头，我把我的时薪给你。不好听，但是真金。」',
        choices: [
          { text: '答应', effects: { stamina: -8, money: 120 }, affinity: 1, result: '四个钟头的灯管，换一百二。她把钱当场转了。' },
          { text: '明天自己也有班', effects: { mood: -1 }, result: '她说理解，语气里没有埋怨。' },
        ],
      },
      {
        id: 'arui-4',
        title: '辞职信',
        locationId: 'shop',
        minDay: 21,
        minAffinity: 2,
        text: '阿蕊把工牌放在扫码枪旁边。「我下周三不干了。不是想开。是再干下去，我连讨厌这里的力气都没了。你呢，还撑得住吗？」',
        choices: [
          { text: '说还撑得住', effects: { mood: 3, hunger: 8 }, affinity: 1, result: '她把一包没过期的面包塞进你袋子。' },
          { text: '说自己也不知道', effects: { mood: 2, hunger: 8 }, affinity: 1, result: '灯管底下静了一会儿。面包最后还是到了你手里。' },
        ],
      },
    ],
  },
];

export function npcById(id: string): NpcDef | undefined {
  return NPCS.find((npc) => npc.id === id);
}
