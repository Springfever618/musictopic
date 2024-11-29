// 获取DOM元素
const audioPlayer = document.getElementById('audioPlayer');
const fileInput = document.getElementById('audioInput');
const playerControls = document.getElementById('player');
const progressBar = document.getElementById('progressBar');
const timeDisplay = document.getElementById('time-display');

// 确保播放器控件始终可见
playerControls.style.display = 'block';

// 文件选择处理
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // 创建音频URL并设置
        const fileURL = URL.createObjectURL(file);
        audioPlayer.src = fileURL;
        
        // 预加载音频
        audioPlayer.load();
        
        // 更新播放器状态显示
        document.getElementById('player-status').textContent = `已选择: ${file.name}`;
        
        console.log('音频文件已加载:', file.name);
    }
});

// 播放功能
function playMusic() {
    if (!audioPlayer.src) {
        alert('请先选择音乐文件');
        return;
    }
    
    audioPlayer.play()
        .then(() => console.log('播放成功'))
        .catch(error => {
            console.error('播放失败:', error);
            alert('播放失败，请重试');
        });
}

// 暂停功能
function pauseMusic() {
    if (audioPlayer.src) {
        audioPlayer.pause();
        console.log('已暂停');
    }
}

// 音频分析函数
async function analyzeMusicStyle(audioFile) {
    try {
        const arrayBuffer = await audioFile.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // 获取音频数据
        const data = audioBuffer.getChannelData(0);
        
        // 简单的音频特征分析
        let energy = 0;
        let zeroCrossings = 0;
        
        for (let i = 0; i < data.length; i++) {
            energy += Math.abs(data[i]);
            if (i > 0 && ((data[i] >= 0 && data[i - 1] < 0) || 
                (data[i] < 0 && data[i - 1] >= 0))) {
                zeroCrossings++;
            }
        }
        
        energy = energy / data.length;
        zeroCrossings = zeroCrossings / data.length;

        // 基于简单特征判断风格
        const styles = [];
        
        if (energy > 0.1) {
            styles.push('激情');
            styles.push('阳光');
        } else {
            styles.push('舒缓');
            styles.push('温暖');
        }
        
        if (zeroCrossings > 0.1) {
            styles.push('快乐');
        } else {
            styles.push('忧郁');
        }

        // 确保不会同时出现“温暖”和“忧郁”
        if (styles.includes('温暖') && styles.includes('忧郁')) {
            styles.splice(styles.indexOf('忧郁'), 1); // 移除“忧郁”
        }

        return styles;
    } catch (error) {
        console.error('音频分析错误:', error);
        return ['温暖', '舒缓']; // 默认风格
    }
}

// 生成图片函数
async function generateImages(keywords) {
    const generatedImages = document.getElementById('generatedImages');
    generatedImages.innerHTML = '<div>生成图片中...</div>'; // 显示加载提示
    document.getElementById('imageResults').style.display = 'block';

    try {
        // 使用更快的图片源
        const imageUrls = [
            `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`,
            `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`,
            `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`,
            `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`
        ];

        // 立即显示图片
        generatedImages.innerHTML = imageUrls.map(url => `
            <div class="image-wrapper">
                <img src="${url}" 
                     alt="生成的图片" 
                     onerror="this.src='https://via.placeholder.com/800x600/cccccc/666666?text=图片加载失败'"
                     loading="lazy">
                <div class="image-keywords">${keywords.join(' · ')}</div>
            </div>
        `).join('');

        return imageUrls;
    } catch (error) {
        console.error('图片生成错误:', error);
        generatedImages.innerHTML = '<div>图片生成失败，请重试</div>';
        return [];
    }
}

// 分析按钮点击事件
document.getElementById('analyzeBtn').addEventListener('click', async function() {
    const file = document.getElementById('audioInput').files[0];
    if (!file) {
        alert('请先选择音乐文件！');
        return;
    }

    const loadingText = document.getElementById('loadingText');
    loadingText.style.display = 'block';

    try {
        // 分析音乐风格
        const styles = await analyzeMusicStyle(file);
        
        // 显示风格关键词
        const styleKeywords = document.getElementById('styleKeywords');
        styleKeywords.innerHTML = styles.map(style => 
            `<span class="keyword">${style}</span>`
        ).join('');
        document.getElementById('styleResults').style.display = 'block';

        // 生成并显示图片
        await generateImages(styles);
    } catch (error) {
        console.error('处理错误:', error);
        alert('处理过程中出现错误，请重试');
    } finally {
        loadingText.style.display = 'none';
    }
});

// 音频加载完成事件
audioPlayer.addEventListener('loadedmetadata', function() {
    progressBar.max = audioPlayer.duration;
    updateTimeDisplay();
});

// 更新进度条和时间显示
audioPlayer.addEventListener('timeupdate', function() {
    progressBar.value = audioPlayer.currentTime;
    updateTimeDisplay();
});

// 进度条控制
progressBar.addEventListener('input', function() {
    audioPlayer.currentTime = this.value;
});

// 时间显示更新
function updateTimeDisplay() {
    const current = formatTime(audioPlayer.currentTime);
    const duration = formatTime(audioPlayer.duration);
    timeDisplay.textContent = `${current} / ${duration}`;
}

// 时间格式化
function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
} 