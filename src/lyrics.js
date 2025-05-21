/**
 * 歌词处理模块
 * 负责解析LRC格式歌词、显示歌词和高亮当前播放位置的歌词
 */

// 初始化变量
const lyricsContainer = document.getElementById('lyricsContainer');
const audioPlayer = document.getElementById('audioPlayer');
const playerControlsContainer =
    document.getElementById('playerControlsContainer');
let parsedLyrics = [];
let currentLyricIndex = -1;
let lyricsLoaded = false;
let currentSongIndex = -1;

// 可用的歌曲列表
const songs = [
  {
    folder: '今天你要嫁给我',
    audio: '蔡依林, 陶喆 - 今天你要嫁给我.mp3',
    lyric: 'a829678b430ea29ff29d7f9aa5bfb955.lrc',
    type: 'audio/mpeg'
  },
  {
    folder: '每到周末我要离开地球',
    audio: '檀健次 - 每到周末我要离开地球.flac',
    lyric: '每到周末我要离开地球 - 檀健次.lrc',
    type: 'audio/flac'
  },
  {
    folder: '美丽的孤独',
    audio: '檀健次 - 美丽的孤独.flac',
    lyric: '美丽的孤独 - 檀健次.lrc',
    type: 'audio/flac'
  },
  {
    folder: '蒙娜丽莎',
    audio: '檀健次 - 蒙娜丽莎.flac',
    lyric: '蒙娜丽莎 - 檀健次.lrc',
    type: 'audio/flac'
  },
  {
    folder: '那些荧火',
    audio: '檀健次 - 那些荧火.flac',
    lyric: '那些荧火 - 檀健次.lrc',
    type: 'audio/flac'
  },
  {
    folder: '烧掉',
    audio: '檀健次 - 烧掉.flac',
    lyric: '烧掉 - 檀健次.lrc',
    type: 'audio/flac'
  },
  {
    folder: '一把烟火放完',
    audio: '檀健次 - 一把烟花放完.flac',
    lyric: '一把烟花放完 - 檀健次.lrc',
    type: 'audio/flac'
  },
  {
    folder: '炙暗时刻',
    audio: '檀健次 - 炙暗时刻.flac',
    lyric: '炙暗时刻 - 檀健次.lrc',
    type: 'audio/flac'
  },
  {
    folder: 'INU',
    audio: '檀健次 - INU.flac',
    lyric: 'INU - 檀健次.lrc',
    type: 'audio/flac'
  }
];

/**
 * 随机选择一首歌曲
 * @returns {number} 选中歌曲的索引
 */
function getRandomSong() {
  // 确保不重复选择同一首歌
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * songs.length);
  } while (newIndex === currentSongIndex && songs.length > 1);

  currentSongIndex = newIndex;
  return currentSongIndex;
}

/**
 * 加载选定的歌曲和歌词
 * @param {number} songIndex - 歌曲索引
 */
function loadSong(songIndex) {
  const song = songs[songIndex];
  const audioPath = `src/music/${song.folder}/${song.audio}`;
  const lrcPath = `src/music/${song.folder}/${song.lyric}`;

  // 更新音频源
  audioPlayer.src = audioPath;
  audioPlayer.type = song.type;

  // 加载歌词
  loadLyrics(lrcPath);

  // 更新背景图片（从歌曲文件夹中的图片）
  try {
    // 如果是MP3，尝试使用文件夹中的图片
    if (song.type === 'audio/mpeg') {
      playerControlsContainer.style.backgroundImage =
          `url('src/music/${song.folder}/109951166916020363.jpg')`;
    }
    // FLAC文件中的专辑图片需要通过元数据API获取，但在普通网页中无法读取
    // 这里我们使用一个简单的回退解决方案
    else {
      // 随机背景颜色作为回退
      const colors =
          ['#ff5e62', '#ff9966', '#a8ff78', '#78ffd6', '#33b5e5', '#8e54e9'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      playerControlsContainer.style.backgroundImage = 'none';
      playerControlsContainer.style.backgroundColor = randomColor;
    }
  } catch (e) {
    console.error('设置背景图片失败:', e);
  }

  // 播放歌曲
  audioPlayer.load();
  audioPlayer.play().catch(err => console.error('播放失败:', err));
}

// 监听播放事件，只有点击播放按钮后才显示歌词容器并加载歌词
audioPlayer.addEventListener('play', () => {
  // 显示歌词容器
  lyricsContainer.style.display = 'block';

  if (!lyricsLoaded) {
    // 第一次点击播放时，随机选择一首歌曲
    loadSong(getRandomSong());
    lyricsLoaded = true;
  } else {
    // 如果歌词已加载，确保当前歌词容器已准备好
    const currentLyricElem = document.getElementById('current-lyric');
    if (!currentLyricElem) {
      prepareLyricsContainer();
    }
  }
});

/**
 * 解析LRC格式歌词
 * @param {string} lrcText - LRC格式的歌词文本
 * @returns {Array} 解析后的歌词数组，每项包含时间和文本
 */
function parseLRC(lrcText) {
  const lines = lrcText.split('\n');
  const lyrics = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = line.substring(match[0].length).trim();
      if (text) {
        lyrics.push({time, text});
      }
    }
  }
  return lyrics.sort((a, b) => a.time - b.time);
}

/**
 * 准备歌词容器
 */
function prepareLyricsContainer() {
  // 清空容器
  lyricsContainer.innerHTML = '';

  // 创建单个歌词行显示元素
  const p = document.createElement('p');
  p.id = 'current-lyric';
  p.textContent = '准备播放...';
  p.setAttribute('data-text', '准备播放...');
  lyricsContainer.appendChild(p);
}

/**
 * 更新当前显示的歌词
 */
function updateCurrentLyric() {
  if (!parsedLyrics.length) return;

  const currentTime = audioPlayer.currentTime;

  // 查找当前应该显示的歌词
  const newLyricIndex = parsedLyrics.findIndex((line, index) => {
    const nextLine = parsedLyrics[index + 1];
    return currentTime >= line.time &&
        (nextLine ? currentTime < nextLine.time : true);
  });

  const currentLyricElem = document.getElementById('current-lyric');

  // 如果显示的歌词发生变化
  if (newLyricIndex !== currentLyricIndex && newLyricIndex !== -1) {
    // 更新歌词文本并添加动画效果
    const lyricText = parsedLyrics[newLyricIndex].text;

    // 先暂停变化，以防止过渡动画冲突
    currentLyricElem.style.transition = 'none';
    currentLyricElem.style.setProperty('--progress', '0%');

    currentLyricElem.textContent = lyricText;
    currentLyricElem.setAttribute('data-text', lyricText);

    currentLyricElem.classList.remove('animate-in');
    void currentLyricElem.offsetWidth;  // 触发重排以便动画重新开始

    // 恢复变化
    currentLyricElem.style.transition = '';
    currentLyricElem.classList.add('animate-in');

    currentLyricIndex = newLyricIndex;
  }  // 更新歌词进度颜色
  if (currentLyricIndex !== -1) {
    // 计算当前歌词的进度比例
    const currentLyricStartTime = parsedLyrics[currentLyricIndex].time;
    const nextLyricIndex = currentLyricIndex + 1;

    // 如果有下一句歌词，用下一句开始时间计算持续时间，否则假设持续时间为3秒
    const lyricDuration = nextLyricIndex < parsedLyrics.length ?
        parsedLyrics[nextLyricIndex].time - currentLyricStartTime :
        3;

    // 计算已播放的比例
    const elapsedTime = currentTime - currentLyricStartTime;
    const progressPercentage =
        Math.min(100, Math.max(0, (elapsedTime / lyricDuration) * 100));

    // 更新伪元素宽度
    currentLyricElem.style.setProperty('--progress', progressPercentage + '%');
  }
}

// 监听音频播放时间更新事件，更新当前歌词
audioPlayer.addEventListener('timeupdate', updateCurrentLyric);

// 监听播放结束事件，随机播放下一首歌曲
audioPlayer.addEventListener('ended', () => {
  loadSong(getRandomSong());
});

/**
 * 加载歌词文件
 * @param {string} lrcPath - 歌词文件路径
 */
function loadLyrics(lrcPath) {
  // 显示加载中的提示
  lyricsContainer.innerHTML = '<p>歌词加载中...</p>';

  fetch(lrcPath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(text => {
        parsedLyrics = parseLRC(text);
        prepareLyricsContainer();
      })
      .catch(error => {
        console.error('歌词加载失败:', error);
        lyricsContainer.innerHTML = '<p>歌词加载失败</p>';
      });
}

// 初始化时不显示任何内容

// 添加随机切换歌曲按钮的事件监听器
document.addEventListener('DOMContentLoaded', () => {
  const nextSongBtn = document.getElementById('nextSongBtn');
  if (nextSongBtn) {
    nextSongBtn.addEventListener('click', () => {
      loadSong(getRandomSong());
    });
  }
});

/**
 * 尝试最后的修复方式：完全移除伪元素，使用两个元素叠加
 */
function fixLyricDisplay() {
  // 删除当前元素
  const oldLyricElem = document.getElementById('current-lyric');
  if (!oldLyricElem || !parsedLyrics.length || currentLyricIndex === -1) return;

  const lyricText = parsedLyrics[currentLyricIndex].text;
  const lyricContainer = document.getElementById('lyricsContainer');

  // 清空容器
  lyricContainer.innerHTML = '';

  // 创建底层元素 - 黑色文本
  const baseLyric = document.createElement('p');
  baseLyric.id = 'base-lyric';
  baseLyric.textContent = lyricText;
  baseLyric.style.cssText = `
    margin: 3px 0;
    padding: 8px 10px;
    color: #333;
    font-weight: 500;
    text-align: center;
    font-size: 14px;
    line-height: 1.4;
    white-space: nowrap;
    background-color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-radius: 3px;
    position: relative;
    z-index: 1;
  `;

  // 创建上层元素 - 渐变色文本
  const colorLyric = document.createElement('p');
  colorLyric.id = 'color-lyric';
  colorLyric.textContent = lyricText;
  colorLyric.style.cssText = `
    margin: 3px 0;
    padding: 8px 10px;
    position: absolute;
    top: 0;
    left: 0;
    font-weight: 500;
    text-align: center;
    font-size: 14px;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    width: 0%;
    color: transparent;
    background: linear-gradient(to right, #ff3366, #ff9933);
    -webkit-background-clip: text;
    background-clip: text;
    z-index: 2;
    transition: width 0.05s linear;
  `;

  // 添加到歌词容器
  lyricContainer.appendChild(baseLyric);
  lyricContainer.appendChild(colorLyric);
}

// 测试修复功能
setTimeout(
    () => {
        // 如果仍有对齐问题，尝试最后的解决方案
        // fixLyricDisplay();
    },
    2000);
