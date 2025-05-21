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

// 监听播放事件，只有点击播放按钮后才加载歌词
audioPlayer.addEventListener('play', () => {
  if (!lyricsLoaded) {
    loadLyrics('src/music/今天你要嫁给我/a829678b430ea29ff29d7f9aa5bfb955.lrc');
    lyricsLoaded = true;
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
 * 显示歌词到歌词容器中
 */
function displayLyrics() {
  lyricsContainer.innerHTML = '';
  parsedLyrics.forEach((line, index) => {
    const p = document.createElement('p');
    p.textContent = line.text;
    p.dataset.index = index;
    lyricsContainer.appendChild(p);
  });
}

/**
 * 更新当前歌词高亮并滚动到可视区域
 */
function updateLyricHighlight() {
  if (!parsedLyrics.length) return;

  const currentTime = audioPlayer.currentTime;

  // 查找当前应该高亮的歌词
  const newLyricIndex = parsedLyrics.findIndex((line, index) => {
    const nextLine = parsedLyrics[index + 1];
    return currentTime >= line.time &&
        (nextLine ? currentTime < nextLine.time : true);
  });

  // 如果高亮的歌词发生变化
  if (newLyricIndex !== currentLyricIndex) {
    // 移除旧的高亮
    const oldLyricElement = lyricsContainer.querySelector(`p.highlight`);
    if (oldLyricElement) {
      oldLyricElement.classList.remove('highlight');
    }

    // 添加新的高亮
    if (newLyricIndex !== -1) {
      const newLyricElement =
          lyricsContainer.querySelector(`p[data-index="${newLyricIndex}"]`);
      if (newLyricElement) {
        newLyricElement.classList.add('highlight');

        // 滚动到当前歌词
        newLyricElement.scrollIntoView({behavior: 'smooth', block: 'center'});
      }
    }
    currentLyricIndex = newLyricIndex;
  }
}

// 监听音频播放时间更新事件，更新高亮歌词
audioPlayer.addEventListener('timeupdate', updateLyricHighlight);

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
        displayLyrics();
      })
      .catch(error => {
        console.error('歌词加载失败:', error);
        lyricsContainer.innerHTML = '<p>歌词加载失败</p>';
      });
}

// 初始化歌词容器内容
lyricsContainer.innerHTML = '<p>点击播放开始加载歌词</p>';
