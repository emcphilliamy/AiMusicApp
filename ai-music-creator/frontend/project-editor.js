// Project Editor JavaScript
// Track management and interface functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeProjectEditor();
});

// Track data structure - start empty
const tracks = [];

// Sample audio regions for demonstration
const sampleAudioRegions = [
    {
        id: 1,
        trackId: null, // Will be assigned when track is created
        name: "Drum Loop 1",
        startTime: 0, // Start at measure 0
        duration: 160, // Duration in pixels (2 measures = 160px)
        type: "drum"
    },
    {
        id: 2,
        trackId: null,
        name: "Bass Line",
        startTime: 80, // Start at measure 1
        duration: 240, // 3 measures
        type: "bass"
    },
    {
        id: 3,
        trackId: null,
        name: "Guitar Riff",
        startTime: 160, // Start at measure 2
        duration: 160, // 2 measures
        type: "guitar"
    },
    {
        id: 4,
        trackId: null,
        name: "Piano Melody",
        startTime: 40, // Start at beat 2 of measure 0
        duration: 200, // 2.5 measures
        type: "piano"
    }
];

let selectedTrackId = null;
let currentlyPlayingAudio = null;
let currentlyPlayingTrackId = null;
let playheadPosition = 0; // Position in pixels - starts at 0px (the visual 0 line)
let playheadStartTime = 0; // For calculating playback position
let audioStartedWithOffset = false; // Track if we started with lead-in offset

// Load a selected project from LikedSamples
function loadSelectedProject(projectId) {
    if (!window.LikedSamplesLoader) {
        console.warn('LikedSamplesLoader not available, loading empty project');
        renderTracks();
        return;
    }
    
    const projectData = window.LikedSamplesLoader.loadLikedSampleProject(projectId);
    if (!projectData) {
        console.error(`Failed to load project ${projectId}`);
        renderTracks();
        return;
    }
    
    // Update project title
    const projectTitle = document.querySelector('.project-info h1');
    if (projectTitle) {
        projectTitle.textContent = projectData.name;
    }
    
    // Update project status
    const projectStatus = document.querySelector('.project-status');
    if (projectStatus) {
        projectStatus.textContent = `${projectData.bpm} BPM • ${projectData.timeSignature}`;
    }
    
    // Clear existing tracks and load project tracks
    tracks.length = 0;
    
    // Add project tracks
    projectData.tracks.forEach(track => {
        tracks.push(track);
    });
    
    // Fill remaining slots with empty tracks
    while (tracks.length < maxTracks) {
        tracks.push(null);
    }
    
    // Update sample audio regions with project data
    sampleAudioRegions.length = 0;
    projectData.audioRegions.forEach(region => {
        sampleAudioRegions.push(region);
    });
    
    renderTracks();
    
    console.log(`Loaded project: ${projectData.name} with ${projectData.tracks.length} tracks`);
}

function initializeProjectEditor() {
    setupEventListeners();
    calculateMaxTracks();
    
    // Check if we should load a specific project
    const selectedProjectId = localStorage.getItem('selectedProjectId');
    if (selectedProjectId) {
        loadSelectedProject(selectedProjectId);
        localStorage.removeItem('selectedProjectId'); // Clean up
    } else {
        // Initialize with empty tracks as before
        renderTracks();
    }
    
    renderTimeline();
    setupTransportControls();
    setupTimelineScrolling();
    
    // Initialize playhead display
    updatePlayheadDisplay();
    
    
    // Initialize complete
}

let maxTracks = 10;

function calculateMaxTracks() {
    const editorMain = document.querySelector('.editor-main');
    if (editorMain) {
        const availableHeight = editorMain.clientHeight - 120; // Account for headers
        maxTracks = Math.floor(availableHeight / 91); // 90px + 1px margin per track
        
        // Ensure minimum 6 tracks for a professional look
        maxTracks = Math.max(maxTracks, 6);
        
        // Add empty tracks if needed
        while (tracks.length < maxTracks) {
            tracks.push(null); // null represents an empty track slot
        }
    }
}

function setupEventListeners() {
    // Add track button
    const addTrackBtn = document.querySelector('.add-track-btn');
    if (addTrackBtn) {
        addTrackBtn.addEventListener('click', addNewTrack);
    }

    // Back button
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
}

function renderTracks() {
    const trackList = document.querySelector('.track-list');
    if (!trackList) return;

    trackList.innerHTML = '';

    tracks.forEach((track, index) => {
        const trackElement = createTrackElement(track, index);
        trackList.appendChild(trackElement);
    });
}

function renderTimeline() {
    renderTimelineHeader();
    renderTimelineTracks();
}

let currentScrollOffset = 0;
const measureWidth = 80; // pixels per measure

function renderTimelineHeader() {
    const timelineHeader = document.getElementById('timeline-header');
    if (!timelineHeader) return;

    timelineHeader.innerHTML = '';

    // Calculate visible measures based on scroll position and container width
    const containerWidth = timelineHeader.clientWidth;

    // Calculate visible range for infinite measure generation
    const startPosition = Math.max(0, currentScrollOffset - 200); // Start a bit before visible area
    const endPosition = currentScrollOffset + containerWidth + 200; // End a bit after visible area
    
    // Generate measure markers infinitely based on visible area
    // "0" at 20px, then every 80px after that: "1" at 100px, "2" at 180px, etc.
    for (let measureNum = 0; measureNum < 1000; measureNum++) { // High limit for infinite scroll
        const pos = 20 + (measureNum * 80); // 20, 100, 180, 260, 340...
        
        // Only create markers that are visible (or close to visible)
        if (pos >= startPosition && pos <= endPosition) {
            const marker = document.createElement('div');
            marker.className = 'measure-marker major';
            marker.style.left = `${pos - currentScrollOffset}px`;
            marker.textContent = measureNum.toString();
            marker.dataset.measure = `measure-${measureNum}`;
            timelineHeader.appendChild(marker);
        }
        
        // Stop if we're way past the visible area
        if (pos > endPosition) break;
    }
}

function renderTimelineTracks() {
    const timelineTracks = document.getElementById('timeline-tracks');
    if (!timelineTracks) return;

    timelineTracks.innerHTML = '';

    tracks.forEach((track, index) => {
        const trackLane = document.createElement('div');
        trackLane.className = 'timeline-track-lane';
        trackLane.dataset.trackIndex = index;
        
        if (track && track.id === selectedTrackId) {
            trackLane.classList.add('selected');
        }
        
        trackLane.addEventListener('click', () => {
            if (track) {
                selectTrack(track.id);
            }
        });
        
        // Add audio regions for this track
        if (track) {
            renderAudioRegionsForTrack(trackLane, track.id);
        }
        
        timelineTracks.appendChild(trackLane);
    });
}

function renderAudioRegionsForTrack(trackLane, trackId) {
    const trackRegions = sampleAudioRegions.filter(region => region.trackId === trackId);
    
    trackRegions.forEach(region => {
        const regionElement = document.createElement('div');
        regionElement.className = `audio-region ${region.type}`;
        regionElement.dataset.regionId = region.id;
        
        // Position and size the region - ensure it starts exactly where specified
        regionElement.style.left = `${region.startTime}px`;
        console.log(`Initial region position: startTime=${region.startTime}px`);
        
        // Debug: Comprehensive positioning analysis
        setTimeout(() => {
            debugRegionPositioning(regionElement, region);
        }, 10);
        regionElement.style.width = `${region.duration}px`;
        
        regionElement.innerHTML = `
            <div class="audio-region-content">
                <div class="audio-region-name">${region.name}</div>
                <canvas class="audio-region-waveform" width="${region.duration}" height="40"></canvas>
                <div class="audio-region-resize-handle"></div>
            </div>
        `;
        
        // Generate waveform for this region
        generateWaveform(regionElement.querySelector('.audio-region-waveform'), region);
        
        // Add click handler for region selection
        regionElement.addEventListener('click', (e) => {
            e.stopPropagation();
            selectAudioRegion(region.id);
        });
        
        // Add drag functionality
        setupAudioRegionDrag(regionElement, region);
        
        trackLane.appendChild(regionElement);
    });
}

function selectAudioRegion(regionId) {
    // Remove previous selection
    document.querySelectorAll('.audio-region').forEach(region => {
        region.classList.remove('selected');
    });
    
    // Add selection to new region
    const regionElement = document.querySelector(`[data-region-id="${regionId}"]`);
    if (regionElement) {
        regionElement.classList.add('selected');
        console.log(`Selected audio region: ${regionId}`);
    }
}

// Audio region drag and drop functionality
function setupAudioRegionDrag(regionElement, regionData) {
    let isDragging = false;
    let isResizing = false;
    let startX = 0;
    let startLeft = 0;
    let startWidth = 0;
    
    // Main region drag
    regionElement.addEventListener('mousedown', (e) => {
        // Don't start drag if clicking on resize handle
        if (e.target.classList.contains('audio-region-resize-handle')) {
            startResize(e);
            return;
        }
        
        startDrag(e);
    });
    
    function startDrag(e) {
        if (e.button !== 0) return; // Only left mouse button
        
        isDragging = true;
        startX = e.clientX;
        startLeft = parseInt(regionElement.style.left);
        
        regionElement.style.cursor = 'grabbing';
        regionElement.classList.add('dragging');
        
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', endDrag);
        e.preventDefault();
    }
    
    function handleDrag(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const newLeft = startLeft + deltaX;
        
        // Snap to grid (20px grid)
        const snappedLeft = Math.round(newLeft / 20) * 20;
        
        // Hard stop at 20px (the 0 line) - regions can't be dragged before the 0 line
        const constrainedLeft = Math.max(20, snappedLeft);
        
        regionElement.style.left = `${constrainedLeft}px`;
        
        // Update the region data
        regionData.startTime = constrainedLeft;
    }
    
    function endDrag() {
        if (isDragging) {
            isDragging = false;
            regionElement.style.cursor = '';
            regionElement.classList.remove('dragging');
            
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', endDrag);
            
            console.log(`Moved region "${regionData.name}" to position ${regionData.startTime}px`);
        }
    }
    
    function startResize(e) {
        if (e.button !== 0) return; // Only left mouse button
        
        isResizing = true;
        startX = e.clientX;
        startWidth = parseInt(regionElement.style.width);
        
        regionElement.classList.add('resizing');
        
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', endResize);
        e.preventDefault();
        e.stopPropagation();
    }
    
    function handleResize(e) {
        if (!isResizing) return;
        
        const deltaX = e.clientX - startX;
        const newWidth = startWidth + deltaX;
        
        // Snap to grid (20px grid) and enforce minimum width
        const snappedWidth = Math.round(newWidth / 20) * 20;
        const constrainedWidth = Math.max(40, snappedWidth); // Minimum 40px width
        
        regionElement.style.width = `${constrainedWidth}px`;
        
        // Update the region data
        regionData.duration = constrainedWidth;
    }
    
    function endResize() {
        if (isResizing) {
            isResizing = false;
            regionElement.classList.remove('resizing');
            
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', endResize);
            
            console.log(`Resized region "${regionData.name}" to ${regionData.duration}px duration`);
        }
    }
}

function createTrackElement(track, index) {
    const trackDiv = document.createElement('div');
    trackDiv.className = 'track-item';
    
    if (!track) {
        // Empty track slot
        trackDiv.innerHTML = `
            <div class="track-header">
                <div class="track-icon" style="background-color: #3a3a3a; opacity: 0.3;">
                    <i class="fas fa-plus"></i>
                </div>
                <div class="track-info">
                    <p class="track-name" style="color: #666;">Empty Track</p>
                    <p class="track-instrument" style="color: #444;">Click to add instrument</p>
                </div>
            </div>
        `;
        
        trackDiv.addEventListener('click', () => {
            // Demo: Add a sample instrument
            const sampleInstruments = [
                { name: "Piano", instrument: "Grand Piano", type: "piano", icon: "fas fa-piano", color: "#9C27B0" },
                { name: "Guitar", instrument: "Electric Guitar", type: "guitar", icon: "fas fa-guitar", color: "#FF5722" },
                { name: "Drums", instrument: "Drum Kit", type: "drum", icon: "fas fa-drum", color: "#4CAF50" },
                { name: "Bass", instrument: "Electric Bass", type: "bass", icon: "fas fa-wave-square", color: "#2196F3" },
                { name: "Synth", instrument: "Synthesizer", type: "synth", icon: "fas fa-wave-square", color: "#00BCD4" }
            ];
            
            const randomInstrument = sampleInstruments[Math.floor(Math.random() * sampleInstruments.length)];
            addInstrumentToTrack(index, randomInstrument);
        });
        
        return trackDiv;
    }
    
    trackDiv.dataset.trackId = track.id;

    trackDiv.innerHTML = `
        <div class="track-header">
            <div class="track-icon ${track.type}" style="background-color: ${track.color}">
                <i class="${track.icon}"></i>
            </div>
            <div class="track-info">
                <p class="track-name">${track.name}</p>
                <p class="track-instrument">${track.instrument}</p>
            </div>
        </div>
        <div class="track-controls">
            <button class="track-control-btn play-track" 
                    data-control="play" title="Play Track">
                <i class="fas fa-play"></i>
            </button>
            <button class="track-control-btn mute ${track.muted ? 'active' : ''}" 
                    data-control="mute" title="Mute">
                M
            </button>
            <button class="track-control-btn solo ${track.solo ? 'active' : ''}" 
                    data-control="solo" title="Solo">
                S
            </button>
            <button class="track-control-btn record ${track.recording ? 'active' : ''}" 
                    data-control="record" title="Record Enable">
                <i class="fas fa-circle"></i>
            </button>
        </div>
        <div class="track-sliders">
            <div class="slider-group">
                <div class="slider-label">Vol</div>
                <input type="range" class="track-slider volume-slider" 
                       min="0" max="100" value="${track.volume}" 
                       data-control="volume">
            </div>
            <div class="slider-group">
                <div class="slider-label">Pan</div>
                <input type="range" class="track-slider pan-slider" 
                       min="-50" max="50" value="${track.pan}" 
                       data-control="pan">
            </div>
        </div>
    `;

    // Add event listeners for track controls
    setupTrackEventListeners(trackDiv, track);

    return trackDiv;
}

function setupTrackEventListeners(trackElement, track) {
    // Track selection
    trackElement.addEventListener('click', (e) => {
        if (!e.target.closest('.track-control-btn') && !e.target.closest('.track-slider')) {
            selectTrack(track.id);
        }
    });

    // Control buttons
    const controlButtons = trackElement.querySelectorAll('.track-control-btn');
    controlButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleTrackControl(track.id, btn.dataset.control, btn);
        });
    });

    // Sliders
    const sliders = trackElement.querySelectorAll('.track-slider');
    sliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
            handleSliderChange(track.id, slider.dataset.control, parseInt(slider.value));
        });
    });
}

function selectTrack(trackId) {
    // Remove previous selection
    document.querySelectorAll('.track-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelectorAll('.timeline-track-lane').forEach(lane => {
        lane.classList.remove('selected');
    });

    // Add selection to new track
    const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
    if (trackElement) {
        trackElement.classList.add('selected');
        selectedTrackId = trackId;
        
        // Also select corresponding timeline lane
        const trackIndex = tracks.findIndex(t => t && t.id === trackId);
        if (trackIndex !== -1) {
            const timelineLane = document.querySelector(`[data-track-index="${trackIndex}"]`);
            if (timelineLane) {
                timelineLane.classList.add('selected');
            }
        }
    }
}

function handleTrackControl(trackId, control, buttonElement) {
    console.log(`=== handleTrackControl called: trackId=${trackId}, control=${control} ===`);
    
    const track = tracks.find(t => t.id === trackId);
    if (!track) {
        console.error(`Track not found in handleTrackControl for ID: ${trackId}`);
        return;
    }

    switch (control) {
        case 'play':
            console.log(`Handling play control for track: ${track.name}`);
            playTrackAudio(trackId, buttonElement);
            break;
        
        case 'mute':
            track.muted = !track.muted;
            buttonElement.classList.toggle('active', track.muted);
            console.log(`Track ${track.name} ${track.muted ? 'muted' : 'unmuted'}`);
            break;
        
        case 'solo':
            track.solo = !track.solo;
            buttonElement.classList.toggle('active', track.solo);
            console.log(`Track ${track.name} ${track.solo ? 'soloed' : 'unsoloed'}`);
            break;
        
        case 'record':
            track.recording = !track.recording;
            buttonElement.classList.toggle('active', track.recording);
            console.log(`Track ${track.name} ${track.recording ? 'record enabled' : 'record disabled'}`);
            break;
    }
}

function handleSliderChange(trackId, control, value) {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    switch (control) {
        case 'volume':
            track.volume = value;
            console.log(`Track ${track.name} volume: ${value}%`);
            break;
        
        case 'pan':
            track.pan = value;
            console.log(`Track ${track.name} pan: ${value > 0 ? 'R' : value < 0 ? 'L' : 'C'}${Math.abs(value)}`);
            break;
    }
}

// Audio playback functionality
function playTrackAudio(trackId, buttonElement) {
    console.log(`=== playTrackAudio called for trackId: ${trackId} ===`);
    
    const track = tracks.find(t => t.id === trackId);
    if (!track) {
        console.error(`Track not found for ID: ${trackId}`);
        console.log(`Available tracks:`, tracks);
        return;
    }
    
    console.log(`Found track: ${track.name}`);
    
    // Find the audio region for this track
    const region = sampleAudioRegions.find(r => r.trackId === trackId);
    console.log(`Audio regions (total: ${sampleAudioRegions.length}):`, sampleAudioRegions);
    console.log(`Found region:`, region);
    
    if (!region || !region.audioFile) {
        console.error(`No audio file found for track ${track.name}. Region:`, region);
        return;
    }
    
    console.log(`Attempting to play audio file: ${region.audioFile}`);
    
    const icon = buttonElement.querySelector('i');
    
    // If this track is already playing, stop it
    if (currentlyPlayingTrackId === trackId && currentlyPlayingAudio) {
        stopCurrentAudio();
        icon.className = 'fas fa-play';
        buttonElement.classList.remove('active');
        return;
    }
    
    // Stop any currently playing audio
    stopCurrentAudio();
    
    // Create and play new audio
    try {
        console.log(`Creating audio element for: ${region.audioFile}`);
        currentlyPlayingAudio = new Audio(region.audioFile);
        currentlyPlayingTrackId = trackId;
        
        // Set volume based on track volume
        currentlyPlayingAudio.volume = track.volume / 100;
        console.log(`Set volume to: ${currentlyPlayingAudio.volume}`);
        
        // Update UI
        icon.className = 'fas fa-pause';
        buttonElement.classList.add('active');
        
        // Handle audio loaded
        currentlyPlayingAudio.addEventListener('loadeddata', () => {
            console.log(`Audio loaded successfully: duration=${currentlyPlayingAudio.duration}s`);
        });
        
        // Handle audio end
        currentlyPlayingAudio.addEventListener('ended', () => {
            console.log('Audio playback ended');
            icon.className = 'fas fa-play';
            buttonElement.classList.remove('active');
            currentlyPlayingAudio = null;
            currentlyPlayingTrackId = null;
            isPlaying = false;
        });
        
        // Handle audio error
        currentlyPlayingAudio.addEventListener('error', (e) => {
            console.error(`Error playing audio: ${region.audioFile}`, e);
            console.error('Audio error details:', currentlyPlayingAudio.error);
            icon.className = 'fas fa-play';
            buttonElement.classList.remove('active');
            currentlyPlayingAudio = null;
            currentlyPlayingTrackId = null;
            isPlaying = false;
        });
        
        // Start playback from playhead position if within region
        const regionStart = region.startTime;
        const regionEnd = regionStart + region.duration;
        const audioOffset = 0.2; // 200ms lead-in time
        
        // Simple playback logic - start from playhead position
        if (playheadPosition >= regionStart && playheadPosition <= regionEnd) {
            // Calculate where to start in the audio based on playhead position
            const positionInRegion = playheadPosition - regionStart;
            const percentageInRegion = positionInRegion / region.duration;
            let startTime = currentlyPlayingAudio.duration * percentageInRegion;
            
            // If at the runway line (0px) and audio starts at 0 line (20px), add lead-in time
            if (playheadPosition === 0 && regionStart === 20) {
                startTime = Math.max(0, startTime - audioOffset);
                audioStartedWithOffset = true;
            } else {
                audioStartedWithOffset = false;
            }
            
            currentlyPlayingAudio.currentTime = startTime;
            playheadStartTime = Date.now() - (startTime * 1000);
            
        } else {
            // If playhead is outside the region, move it to region start
            console.log(`Playhead outside region, moving from ${playheadPosition} to ${regionStart}`);
            playheadPosition = regionStart;
            updatePlayheadDisplay();
            playheadStartTime = Date.now();
            
            // Apply offset for region start - only when actually at the 0 line
            if (regionStart === 20) {
                const startTime = Math.max(0, -audioOffset);
                currentlyPlayingAudio.currentTime = startTime;
                audioStartedWithOffset = true;
                console.log(`Starting audio at region start with ${audioOffset}s lead-in time`);
            } else {
                currentlyPlayingAudio.currentTime = 0;
                audioStartedWithOffset = false;
                console.log(`Starting audio at region start without offset`);
            }
        }
        
        const playPromise = currentlyPlayingAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log(`Successfully started playing: ${region.audioFile}`);
                // Start playhead animation
                movePlayheadDuringPlayback();
            }).catch((error) => {
                console.error('Error starting playback:', error);
                icon.className = 'fas fa-play';
                buttonElement.classList.remove('active');
                currentlyPlayingAudio = null;
                currentlyPlayingTrackId = null;
                isPlaying = false;
                // Reset main play button too
                const playBtn = document.getElementById('play-btn');
                const playIcon = playBtn.querySelector('i');
                playIcon.className = 'fas fa-play';
                playBtn.style.background = '#4a9eff';
            });
        } else {
            console.log(`Playing (legacy): ${region.audioFile}`);
            // Start playhead animation
            movePlayheadDuringPlayback();
        }
        
    } catch (error) {
        console.error('Error creating audio element:', error);
        icon.className = 'fas fa-play';
        buttonElement.classList.remove('active');
        isPlaying = false;
        // Reset main play button too
        const playBtn = document.getElementById('play-btn');
        const playIcon = playBtn.querySelector('i');
        playIcon.className = 'fas fa-play';
        playBtn.style.background = '#4a9eff';
    }
}

function stopCurrentAudio() {
    if (currentlyPlayingAudio) {
        currentlyPlayingAudio.pause();
        currentlyPlayingAudio.currentTime = 0;
        currentlyPlayingAudio = null;
    }
    
    // Reset all track play buttons
    document.querySelectorAll('.track-control-btn.play-track').forEach(btn => {
        const icon = btn.querySelector('i');
        icon.className = 'fas fa-play';
        btn.classList.remove('active');
    });
    
    currentlyPlayingTrackId = null;
    audioStartedWithOffset = false;
}

// Waveform generation function
function generateWaveform(canvas, region) {
    if (!canvas || !region.audioFile) {
        console.log('Cannot generate waveform: missing canvas or audio file');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // For now, generate a procedural waveform based on the audio type
    // In a real implementation, you'd load and analyze the actual audio file
    generateProceduralWaveform(ctx, width, height, region.type, region.name);
}

function generateProceduralWaveform(ctx, width, height, type, name) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1;
    
    const centerY = height / 2;
    const samples = width / 2; // One sample per 2 pixels
    
    // Generate different waveform patterns based on instrument type
    const seed = hashString(name); // Create consistent randomness based on name
    let waveformData = [];
    
    for (let i = 0; i < samples; i++) {
        const x = (i / samples) * width;
        let amplitude = 0;
        
        switch (type) {
            case 'drum':
                // Sharp attacks, quick decay
                amplitude = generateDrumWaveform(i, samples, seed);
                break;
            case 'bass':
                // Lower frequency, smoother waves
                amplitude = generateBassWaveform(i, samples, seed);
                break;
            case 'synth':
                // Electronic, square-ish waves
                amplitude = generateSynthWaveform(i, samples, seed);
                break;
            case 'guitar':
                // Stringed instrument characteristics
                amplitude = generateGuitarWaveform(i, samples, seed);
                break;
            case 'piano':
                // Piano-like envelope
                amplitude = generatePianoWaveform(i, samples, seed);
                break;
            default:
                amplitude = Math.random() * 0.8;
        }
        
        waveformData.push({ x, amplitude });
    }
    
    // Draw the waveform as individual vertical lines (proper peaks and valleys)
    ctx.beginPath();
    for (let i = 0; i < waveformData.length; i++) {
        const { x, amplitude } = waveformData[i];
        const barHeight = amplitude * centerY * 0.9;
        
        // Draw individual vertical lines from center outward
        ctx.moveTo(x, centerY - barHeight);
        ctx.lineTo(x, centerY + barHeight);
    }
    ctx.stroke();
}

// Hash function for consistent randomness
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
}

// Waveform generators for different instrument types
function generateDrumWaveform(i, samples, seed) {
    const progress = i / samples;
    
    // Create more random, spiky drum pattern instead of gradual decay
    const noise1 = Math.sin(i * 0.5 + seed * 100) * Math.cos(i * 0.8 + seed * 150);
    const noise2 = Math.sin(i * 0.3 + seed * 200) * 0.7;
    const highFreq = Math.sin(i * 2.5 + seed * 300) * 0.4;
    
    const combinedNoise = (noise1 + noise2 + highFreq) / 3;
    
    // Sharp attack, exponential decay but with variation
    const attack = progress < 0.1 ? progress * 10 : 1;
    const decay = Math.exp(-progress * 3) * (0.8 + Math.random() * 0.4);
    
    return Math.abs(combinedNoise) * attack * decay;
}

function generateBassWaveform(i, samples, seed) {
    const progress = i / samples;
    const frequency = 0.08; // Low frequency
    
    // Create bass-like waveform with harmonics
    const fundamental = Math.sin(i * frequency + seed * 10);
    const harmonic = Math.sin(i * frequency * 2 + seed * 20) * 0.3;
    const wave = (fundamental + harmonic) * 0.8;
    
    const envelope = Math.exp(-progress * 1.5); // Gradual decay
    
    return Math.abs(wave) * envelope;
}

function generateSynthWaveform(i, samples, seed) {
    const progress = i / samples;
    const frequency = 0.12;
    
    // Electronic sawtooth/square-ish wave with variation
    const square = Math.sign(Math.sin(i * frequency + seed * 20));
    const sawtooth = (2 * ((i * frequency + seed * 10) % (2 * Math.PI)) / (2 * Math.PI)) - 1;
    const wave = (square * 0.6 + sawtooth * 0.4) * 0.7;
    const envelope = 1 - progress * 0.5; // Slow fade
    
    return Math.abs(wave) * envelope;
}

function generateGuitarWaveform(i, samples, seed) {
    const progress = i / samples;
    const frequency = 0.08;
    
    // Multiple harmonics for string-like sound
    const fundamental = Math.sin(i * frequency + seed * 15);
    const harmonic = Math.sin(i * frequency * 2 + seed * 25) * 0.3;
    
    const wave = fundamental + harmonic;
    const envelope = Math.exp(-progress * 1.5);
    
    return Math.abs(wave) * envelope;
}

function generatePianoWaveform(i, samples, seed) {
    const progress = i / samples;
    const frequency = 0.06;
    
    // Piano-like attack and decay
    const wave = Math.sin(i * frequency + seed * 12) * 0.9;
    const attack = progress < 0.05 ? progress * 20 : 1;
    const decay = Math.exp(-progress * 3);
    
    return Math.abs(wave) * attack * decay;
}

function addNewTrack() {
    // Find the first empty slot or add to the end
    const emptyIndex = tracks.findIndex(t => t === null);
    const newTrackId = Math.max(0, ...tracks.filter(t => t !== null).map(t => t.id)) + 1;
    
    const newTrack = {
        id: newTrackId,
        name: `Track ${newTrackId}`,
        instrument: "Audio Track",
        type: "audio",
        icon: "fas fa-music",
        color: "#9C27B0",
        muted: false,
        solo: false,
        recording: false,
        volume: 75,
        pan: 0
    };

    if (emptyIndex !== -1) {
        tracks[emptyIndex] = newTrack;
    } else {
        tracks.push(newTrack);
    }
    
    // Re-render tracks and timeline
    renderTracks();
    renderTimeline();
    
    selectTrack(newTrackId);
    console.log(`Added new track: ${newTrack.name}`);
}

function addInstrumentToTrack(trackIndex, instrumentData) {
    const newTrackId = Math.max(0, ...tracks.filter(t => t !== null).map(t => t.id)) + 1;
    
    const newTrack = {
        id: newTrackId,
        name: instrumentData.name || `Track ${newTrackId}`,
        instrument: instrumentData.instrument || "Audio Track",
        type: instrumentData.type || "audio",
        icon: instrumentData.icon || "fas fa-music",
        color: instrumentData.color || "#9C27B0",
        muted: false,
        solo: false,
        recording: false,
        volume: 75,
        pan: 0
    };

    tracks[trackIndex] = newTrack;
    
    // Add a sample audio region for this track
    const availableRegion = sampleAudioRegions.find(region => 
        region.type === instrumentData.type && region.trackId === null
    );
    
    if (availableRegion) {
        availableRegion.trackId = newTrackId;
        console.log(`Added audio region "${availableRegion.name}" to track ${newTrack.name}`);
    }
    
    // Re-render tracks and timeline
    renderTracks();
    renderTimeline();
    
    selectTrack(newTrackId);
    console.log(`Added instrument to track ${trackIndex + 1}: ${newTrack.name}`);
}

function setupTransportControls() {
    const playBtn = document.getElementById('play-btn');
    const recordBtn = document.getElementById('record-btn');
    const rewindBtn = document.getElementById('rewind-btn');

    if (playBtn) {
        playBtn.addEventListener('click', togglePlayback);
    }

    if (recordBtn) {
        recordBtn.addEventListener('click', toggleRecording);
    }

    if (rewindBtn) {
        rewindBtn.addEventListener('click', rewindToStart);
    }
}

let isPlaying = false;
let isRecording = false;

// Debug function to test audio loading
window.testAudioLoad = function(filename) {
    console.log(`Testing audio load: ${filename}`);
    const audio = new Audio(filename);
    audio.addEventListener('canplaythrough', () => {
        console.log('✅ Audio can play through:', filename);
    });
    audio.addEventListener('error', (e) => {
        console.error('❌ Audio load error:', e, filename);
    });
    audio.load();
};

function togglePlayback() {
    console.log('=== PLAY BUTTON CLICKED ===');
    console.log('togglePlayback called, isPlaying:', isPlaying);
    
    const playBtn = document.getElementById('play-btn');
    const icon = playBtn.querySelector('i');
    
    if (isPlaying) {
        // Stop playback
        stopCurrentAudio();
        isPlaying = false;
        icon.className = 'fas fa-play';
        playBtn.style.background = '#4a9eff';
        console.log('Playback stopped');
    } else {
        // Start playback - find first track with audio
        console.log('=== LOOKING FOR TRACKS WITH AUDIO ===');
        console.log('Available tracks:', tracks.length, tracks);
        console.log('Available audio regions:', sampleAudioRegions.length, sampleAudioRegions);
        
        const firstTrackWithAudio = tracks.find(track => {
            if (!track) {
                console.log('Found empty track slot');
                return false;
            }
            const region = sampleAudioRegions.find(r => r.trackId === track.id);
            console.log(`Track ${track.id} (${track.name}) has region:`, region);
            if (region && region.audioFile) {
                console.log(`✅ Found audio file: ${region.audioFile}`);
                return true;
            } else {
                console.log(`❌ No audio file for track ${track.name}`);
                return false;
            }
        });
        
        console.log('First track with audio:', firstTrackWithAudio);
        
        if (firstTrackWithAudio) {
            const trackPlayBtn = document.querySelector(`[data-track-id="${firstTrackWithAudio.id}"] .play-track`);
            console.log('Track play button found:', trackPlayBtn);
            
            if (trackPlayBtn) {
                // Set isPlaying to true and update UI only after audio starts successfully
                isPlaying = true;
                icon.className = 'fas fa-pause';
                playBtn.style.background = '#ff6b6b';
                console.log('Playback started');
                
                playTrackAudio(firstTrackWithAudio.id, trackPlayBtn);
            } else {
                console.error('Could not find track play button');
            }
        } else {
            console.error('No tracks with audio found');
        }
    }
}

function toggleRecording() {
    isRecording = !isRecording;
    const recordBtn = document.getElementById('record-btn');
    
    if (isRecording) {
        recordBtn.style.background = '#ff4444';
        recordBtn.style.color = '#ffffff';
        console.log('Recording started');
    } else {
        recordBtn.style.background = '#3a3a3a';
        recordBtn.style.color = '#ff4444';
        console.log('Recording stopped');
    }
}

function rewindToStart() {
    console.log('Rewound to start');
    const timelineContent = document.querySelector('.timeline-content');
    if (!timelineContent) return;
    
    // Stop any playing audio
    stopCurrentAudio();
    
    // Reset playhead to start
    resetPlayheadToStart();
    
    const startPosition = timelineContent.scrollLeft;
    const targetPosition = 0;
    const distance = startPosition - targetPosition;
    
    if (distance <= 0) return; // Already at start
    
    // Fixed duration snap back - very fast regardless of distance
    const duration = 200; // 0.2 seconds (200ms)
    const startTime = performance.now();
    
    function animateRewind(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Cubic ease-out for smooth but fast snap
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        const currentPosition = startPosition - (distance * easeOut);
        timelineContent.scrollLeft = Math.max(0, currentPosition);
        
        if (progress < 1) {
            requestAnimationFrame(animateRewind);
        }
    }
    
    requestAnimationFrame(animateRewind);
}

function setupTimelineScrolling() {
    const timelineContent = document.querySelector('.timeline-content');
    const timelineHeader = document.getElementById('timeline-header');
    
    if (!timelineContent || !timelineHeader) return;

    // Sync header scroll with content scroll
    timelineContent.addEventListener('scroll', function() {
        const scrollLeft = this.scrollLeft;
        
        // Hard stop at 0 - prevent negative scrolling
        if (scrollLeft < 0) {
            this.scrollLeft = 0;
            return;
        }
        
        currentScrollOffset = scrollLeft;
        
        // Update header to show current measures
        renderTimelineHeader();
        
        // Update background position to maintain grid alignment
        this.style.backgroundPosition = `-${scrollLeft}px 0`;
        
        // Update track lane backgrounds to stay aligned (accounting for -0.5px offset)
        const trackLanes = document.querySelectorAll('.timeline-track-lane');
        trackLanes.forEach(lane => {
            lane.style.backgroundPosition = `${-0.5 - scrollLeft}px 0`;
        });
        
        // Update playhead position relative to scroll
        updatePlayheadDisplay();
    });

    // Add wheel event for horizontal scrolling
    timelineContent.addEventListener('wheel', function(e) {
        if (e.deltaY !== 0) {
            e.preventDefault();
            const newScrollLeft = this.scrollLeft + e.deltaY;
            
            // Hard stop at 0 - can't scroll past the 0 line
            this.scrollLeft = Math.max(0, newScrollLeft);
        }
    });
    
    // Add click-to-position functionality
    timelineContent.addEventListener('click', function(e) {
        // Don't handle clicks on audio regions or track lanes
        if (e.target.closest('.audio-region') || e.target.closest('.timeline-track-lane')) {
            return;
        }
        
        const rect = this.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newPosition = clickX + this.scrollLeft;
        
        // Snap to grid (20px increments)
        playheadPosition = Math.round(newPosition / 20) * 20;
        playheadPosition = Math.max(0, playheadPosition); // Don't go below the 0 line (0px)
        
        updatePlayheadDisplay();
        
        // If audio is playing, seek to new position
        if (currentlyPlayingAudio) {
            seekToPlayheadPosition();
        }
        
        console.log(`Playhead moved to position: ${playheadPosition}px`);
    });
}

// Playhead management functions
function updatePlayheadDisplay() {
    const playhead = document.getElementById('timeline-playhead');
    if (!playhead) return;
    
    const timelineContent = document.querySelector('.timeline-content');
    if (!timelineContent) return;
    
    // Position playhead relative to scroll
    const displayPosition = playheadPosition - timelineContent.scrollLeft;
    playhead.style.left = `${displayPosition}px`;
    
    
    // Show/hide playhead if it's outside visible area
    const contentWidth = timelineContent.clientWidth;
    if (displayPosition < -2 || displayPosition > contentWidth + 2) {
        playhead.style.opacity = '0';
    } else {
        playhead.style.opacity = '1';
    }
}

function seekToPlayheadPosition() {
    if (!currentlyPlayingAudio) return;
    
    // Find the audio region for the currently playing track
    const region = sampleAudioRegions.find(r => r.trackId === currentlyPlayingTrackId);
    if (!region) return;
    
    // Calculate the relative position within the audio region
    const regionStart = region.startTime;
    const regionEnd = regionStart + region.duration;
    const audioOffset = 0.2; // 200ms lead-in time
    
    // If playhead is within the audio region
    if (playheadPosition >= regionStart && playheadPosition <= regionEnd) {
        const positionInRegion = playheadPosition - regionStart;
        const percentageInRegion = positionInRegion / region.duration;
        let seekTime = currentlyPlayingAudio.duration * percentageInRegion;
        
        // Apply offset if seeking to the beginning
        if (playheadPosition === 0 || playheadPosition === regionStart) {
            seekTime = Math.max(0, seekTime - audioOffset);
            console.log(`Seeking with ${audioOffset}s lead-in time`);
        }
        
        currentlyPlayingAudio.currentTime = Math.max(0, Math.min(seekTime, currentlyPlayingAudio.duration));
        playheadStartTime = Date.now() - (seekTime * 1000);
        
        console.log(`Seeked to ${seekTime.toFixed(2)}s in audio`);
    }
}

function movePlayheadDuringPlayback() {
    if (!currentlyPlayingAudio || !isPlaying) {
        console.log('movePlayheadDuringPlayback: stopped - audio or isPlaying false');
        return;
    }
    
    const region = sampleAudioRegions.find(r => r.trackId === currentlyPlayingTrackId);
    if (!region) {
        console.log('movePlayheadDuringPlayback: no region found');
        return;
    }
    
    const currentTime = currentlyPlayingAudio.currentTime;
    const duration = currentlyPlayingAudio.duration;
    const audioOffset = 0.2; // 200ms lead-in time
    
    if (duration > 0) {
        // During lead-in period: don't move playhead
        if (audioStartedWithOffset && currentTime < audioOffset) {
            // Stay at current position during lead-in
            updatePlayheadDisplay();
        } else {
            // Normal playback: move playhead based on audio time
            let effectiveTime = currentTime;
            let effectiveDuration = duration;
            
            // If we started with offset, subtract it from calculations
            if (audioStartedWithOffset) {
                effectiveTime = Math.max(0, currentTime - audioOffset);
                effectiveDuration = duration - audioOffset;
            }
            
            const percentage = effectiveTime / effectiveDuration;
            playheadPosition = region.startTime + (region.duration * percentage);
            
            // Ensure playhead doesn't exceed region bounds
            playheadPosition = Math.min(region.startTime + region.duration, playheadPosition);
            updatePlayheadDisplay();
        }
    }
    
    // Continue updating if still playing
    if (isPlaying && !currentlyPlayingAudio.paused && !currentlyPlayingAudio.ended) {
        requestAnimationFrame(movePlayheadDuringPlayback);
    } else {
        console.log('movePlayheadDuringPlayback: stopping animation');
    }
}

function resetPlayheadToStart() {
    playheadPosition = 0; // Reset to the runway line (first grid line at 0px)
    updatePlayheadDisplay();
}


// Create debug panel in the UI
function createDebugPanel() {
    // Remove existing panel if it exists
    const existing = document.getElementById('debug-panel');
    if (existing) {
        existing.remove();
    }
    
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.cssText = `
        position: fixed !important;
        top: 10px !important;
        right: 10px !important;
        width: 400px !important;
        max-height: 400px !important;
        background: rgba(255, 0, 0, 0.9) !important;
        color: white !important;
        font-family: monospace !important;
        font-size: 12px !important;
        padding: 15px !important;
        border-radius: 8px !important;
        z-index: 99999 !important;
        overflow-y: auto !important;
        border: 3px solid yellow !important;
        box-shadow: 0 0 20px rgba(255, 255, 0, 0.5) !important;
    `;
    debugPanel.innerHTML = '<h3 style="margin: 0 0 10px 0; color: yellow;">🔧 DEBUG PANEL - VISIBLE</h3><div id="debug-content">Panel loaded successfully!</div>';
    
    document.body.appendChild(debugPanel);
    console.log("Debug panel added to body:", debugPanel);
    
    // Test if panel is actually visible
    setTimeout(() => {
        const rect = debugPanel.getBoundingClientRect();
        console.log("Debug panel position:", rect);
        if (rect.width === 0 || rect.height === 0) {
            alert("Debug panel created but not visible!");
        }
    }, 100);
}

// Add text to debug panel
function addDebugText(text) {
    const content = document.getElementById('debug-content');
    if (content) {
        content.innerHTML += `<div>${text}</div>`;
    }
    console.log(text);
}

// Run comprehensive debug
function runComprehensiveDebug() {
    addDebugText("=== INITIAL DOM STRUCTURE DEBUG ===");
    
    const timelineContent = document.querySelector('.timeline-content');
    const timelineTracks = document.querySelector('.timeline-tracks');
    const playhead = document.getElementById('timeline-playhead');
    
    if (timelineContent) {
        const rect = timelineContent.getBoundingClientRect();
        const style = window.getComputedStyle(timelineContent);
        addDebugText(`timeline-content: left=${rect.left.toFixed(1)}, width=${rect.width.toFixed(1)}, paddingLeft=${style.paddingLeft}, marginLeft=${style.marginLeft}`);
    }
    
    if (timelineTracks) {
        const rect = timelineTracks.getBoundingClientRect();
        const style = window.getComputedStyle(timelineTracks);
        addDebugText(`timeline-tracks: left=${rect.left.toFixed(1)}, width=${rect.width.toFixed(1)}, paddingLeft=${style.paddingLeft}, marginLeft=${style.marginLeft}, position=${style.position}, offsetLeft=${timelineTracks.offsetLeft}`);
    }
    
    if (playhead) {
        const rect = playhead.getBoundingClientRect();
        const style = window.getComputedStyle(playhead);
        addDebugText(`playhead: left=${rect.left.toFixed(1)}, styleLeft=${playhead.style.left}, computedLeft=${style.left}`);
    }
    
    addDebugText("=== END INITIAL DEBUG ===");
}

// Debug function to analyze positioning
function debugRegionPositioning(regionElement, region) {
    addDebugText("=== REGION POSITIONING DEBUG ===");
    
    // Get all the containers in the hierarchy
    const timelineContent = document.querySelector('.timeline-content');
    const timelineTracks = document.querySelector('.timeline-tracks');
    const trackLane = regionElement.parentElement;
    
    // Get bounding rectangles for all elements
    const timelineContentRect = timelineContent?.getBoundingClientRect();
    const timelineTracksRect = timelineTracks?.getBoundingClientRect();
    const trackLaneRect = trackLane?.getBoundingClientRect();
    const regionRect = regionElement.getBoundingClientRect();
    
    addDebugText("ELEMENT HIERARCHY:");
    addDebugText(`1. timeline-content: left=${timelineContentRect?.left.toFixed(1)}`);
    addDebugText(`2. timeline-tracks: left=${timelineTracksRect?.left.toFixed(1)}`);
    addDebugText(`3. track-lane: left=${trackLaneRect?.left.toFixed(1)}`);
    addDebugText(`4. audio-region: left=${regionRect.left.toFixed(1)}, styleLeft=${regionElement.style.left}`);
    
    addDebugText("KEY MEASUREMENTS:");
    if (timelineContentRect && regionRect) {
        const relativeToContent = regionRect.left - timelineContentRect.left;
        addDebugText(`Region relative to timeline-content: ${relativeToContent.toFixed(1)}px`);
    }
    if (timelineTracksRect && regionRect) {
        const relativeToTracks = regionRect.left - timelineTracksRect.left;
        addDebugText(`Region relative to timeline-tracks: ${relativeToTracks.toFixed(1)}px`);
    }
    
    addDebugText(`Expected startTime: ${region.startTime}px`);
    
    // Find the "0 line" - look for where the playhead should be at position 0
    const playhead = document.getElementById('timeline-playhead');
    if (playhead) {
        const playheadRect = playhead.getBoundingClientRect();
        const distanceFromPlayhead = regionRect.left - playheadRect.left;
        addDebugText(`🎯 Region distance from 0 line: ${distanceFromPlayhead.toFixed(1)}px`);
        
        if (Math.abs(distanceFromPlayhead) > 1) {
            addDebugText(`❌ PROBLEM FOUND: Region should be at 0 line but is ${distanceFromPlayhead.toFixed(1)}px away!`);
        } else {
            addDebugText(`✅ Region positioning looks correct`);
        }
    }
    
    addDebugText("=== END REGION DEBUG ===");
}

// Export functions for potential use in other modules
window.ProjectEditor = {
    tracks,
    selectTrack,
    addNewTrack,
    togglePlayback,
    toggleRecording
};