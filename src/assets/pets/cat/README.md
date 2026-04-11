# 猫咪图片资源

## 当前状态

**目录位置**: `/Users/alipayzilu/Documents/GitHub/ding-zhe/src/assets/pets/cat/`

**设计参考图**: `design-reference.png` (包含所有表情)

## 图片列表

当前所有文件都是占位图片，需要您从设计稿中裁剪替换：

| 状态 | 文件名 | 在设计稿中的位置 | 需要替换 |
|------|--------|-----------------|---------|
| IDLE | `idle.png` | 左上角 Base Pose | ✅ |
| HAPPY | `happy.png` | 第一行 左 | ✅ |
| CURIOUS | `curious.png` | 第一行 右 | ✅ |
| ANGRY | `angry.png` | 第二行 左 | ✅ |
| SLEEPY | `sleeping.png` | 第二行 右 | ✅ |
| PLAYING | `playing.png` | 第三行 左 | ✅ |
| SITTING | `sitting.png` | 第三行 左二 | ✅ |
| LYING | `lying.png` | 第三行 右二 | ✅ |
| STANDING | `standing.png` | 第三行 右 | ✅ |
| ERROR | `error.png` | 第四行 左 | ✅ |
| ACHIEVEMENT | `achievement.png` | 第四行 左二 | ✅ |
| NOTIFICATION | `notification.png` | 第四行 右二 | ✅ |
| EMPTY | `empty.png` | 第四行 右 | ✅ |
| EATING | `eating.png` | 设计稿中未显示 | ❓ |
| THINKING | `thinking.png` | 设计稿中未显示 | ❓ |
| LOVE | `love.png` | 设计稿中未显示 | ❓ |

## 裁剪步骤

1. 打开 `design-reference.png`
2. 使用图片编辑工具裁剪每个表情
3. 保存为 PNG（透明背景）
4. 替换对应文件名的文件
5. 建议尺寸：512x512

## 设计稿表情分布

```
┌─────────────────────────────────────────────────┐
│  [IDLE]        [HAPPY]  [CURIOUS]               │
│  (Base Pose)   (开心)   (好奇)                  │
│                                                 │
│                [ANGRY]  [SLEEPY]                │
│                 (生气)   (困倦)                  │
│                                                 │
│  [PLAYING] [SITTING] [LYING]  [STANDING]        │
│   (玩耍)    (坐着)    (躺着)    (站立)          │
│                                                 │
│  [ERROR] [ACHIEVEMENT] [NOTIFICATION] [EMPTY]   │
│  (错误)   (成就)       (通知)       (空状态)    │
└─────────────────────────────────────────────────┘
```

## 注意事项

- 当前所有图片都是占位图（design-reference.png 的副本）
- 裁剪后替换对应文件即可
- EATING、THINKING、LOVE 在设计稿中未显示，可能需要额外生成