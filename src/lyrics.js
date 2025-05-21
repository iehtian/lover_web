/**
 * 歌词处理模块
 * 负责解析LRC格式歌词、显示歌词和高亮当前播放位置的歌词
 */

// 初始化变量
const lyricsContainer = document.getElementById('lyricsContainer');
const audioPlayer = document.getElementById('audioPlayer');
let parsedLyrics = [];
let currentLyricIndex = -1;
let lyricsLoaded = false;

// 监听播放事件，只有点击播放按钮后才显示歌词容器并加载歌词
audioPlayer.addEventListener('play', () => {
  // 显示歌词容器
  lyricsContainer.style.display = 'block';

  if (!lyricsLoaded) {
    loadLyrics('src/music/今天你要嫁给我/a829678b430ea29ff29d7f9aa5bfb955.lrc');
    lyricsLoaded = true;
  } else {
    // 如果歌词已加载，确保当前歌词容器已准备好
    const currentLyricElem = document.getElementById('current-lyric');
    if (!currentLyricElem) {
      prepareLyricsContainer();
    }
  }

  // 预先测量文本宽度
  setTimeout(measureTextWidths, 500);
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
