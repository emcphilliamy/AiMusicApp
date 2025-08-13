// LikedSamples Loader Module
// Handles loading and parsing of LikedSamples metadata files

// Sample metadata for the liked samples (would normally be loaded from server)
const likedSamplesData = [
    {
        fileName: "Deep_House_Electronic-MB.md",
        audioFile: "Deep_House_Electronic-MB.wav",
        title: "Deep House Electronic",
        genre: "POP",
        instrument: "SYNTH_LEAD",
        bpm: 125,
        prompt: "deep house electronic like Daft Punk 125 bpm",
        style: "pop",
        duration: 3.840,
        generated: "8/12/2025, 4:59:07 PM",
        content: "Melodic pattern",
        size: "330.9 KB",
        description: "Electronic dance track with Daft Punk influences"
    },
    {
        fileName: "House_Music_Electronic-MB.md",
        audioFile: "House_Music_Electronic-MB.wav",
        title: "House Music Electronic",
        genre: "JAZZ",
        instrument: "SYNTH_LEAD",
        bpm: 120,
        prompt: "house music electronic dance 120 bpm four on the floor",
        style: "jazz",
        duration: 4.000,
        generated: "8/12/2025, 4:58:32 PM",
        content: "Multi-bar melodic sequence",
        size: "344.7 KB",
        description: "Four-on-the-floor house music with jazz influences"
    },
    {
        fileName: "LateNight-drums1.md",
        audioFile: "LateNight-drums1.wav",
        title: "LateNight",
        genre: "LO-FI",
        instrument: "DRUMS",
        bpm: 75,
        prompt: "lo-fi late night drums",
        style: "lo-fi",
        duration: 6.400,
        generated: "8/10/2025, 8:14:22 PM",
        content: "Chill drum pattern",
        size: "551.4 KB",
        description: "Relaxing lo-fi drum patterns for late night vibes"
    },
    {
        fileName: "Sci-fi_Sound-MB.md",
        audioFile: "Sci-fi_Sound-MB.wav",
        title: "Sci-fi Sound",
        genre: "ELECTRONIC",
        instrument: "SYNTH",
        bpm: 110,
        prompt: "sci-fi atmospheric electronic sound",
        style: "ambient",
        duration: 5.2,
        generated: "8/11/2025, 2:30:15 PM",
        content: "Atmospheric soundscape",
        size: "412.3 KB",
        description: "Futuristic ambient electronic textures"
    },
    {
        fileName: "StyleTest_house_1-drums1.md",
        audioFile: "StyleTest_house_1-drums1.wav",
        title: "StyleTest House 1",
        genre: "HOUSE",
        instrument: "DRUMS",
        bpm: 128,
        prompt: "house style test drums",
        style: "house",
        duration: 4.8,
        generated: "8/11/2025, 11:45:30 AM",
        content: "House drum test pattern",
        size: "398.1 KB",
        description: "Classic house drum patterns for testing"
    }
];

// Function to get all liked samples projects
function getLikedSamplesProjects() {
    return likedSamplesData.map((sample, index) => ({
        id: `liked-${index + 1}`,
        name: sample.title,
        description: sample.description,
        bpm: sample.bpm,
        style: sample.style,
        genre: sample.genre,
        duration: sample.duration,
        size: sample.size,
        created: sample.generated,
        audioFile: `LikedSamples/${sample.audioFile}`,
        metadata: sample,
        type: 'liked-sample'
    }));
}

// Function to load a specific project
function loadLikedSampleProject(projectId) {
    const projects = getLikedSamplesProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
        console.error(`Project ${projectId} not found`);
        return null;
    }
    
    // Convert the liked sample to project data format
    const projectData = {
        id: project.id,
        name: project.name,
        bpm: project.bpm,
        timeSignature: "4/4",
        tracks: [],
        audioRegions: []
    };
    
    // Create a track based on the instrument type
    const instrumentMap = {
        'SYNTH_LEAD': { type: 'synth', icon: 'fas fa-wave-square', color: '#00BCD4' },
        'SYNTH': { type: 'synth', icon: 'fas fa-wave-square', color: '#00BCD4' },
        'DRUMS': { type: 'drum', icon: 'fas fa-drum', color: '#4CAF50' },
        'BASS': { type: 'bass', icon: 'fas fa-wave-square', color: '#2196F3' },
        'GUITAR': { type: 'guitar', icon: 'fas fa-guitar', color: '#FF5722' },
        'PIANO': { type: 'piano', icon: 'fas fa-piano', color: '#9C27B0' }
    };
    
    const instrument = instrumentMap[project.metadata.instrument] || instrumentMap['SYNTH'];
    
    // Create track
    const track = {
        id: 1,
        name: project.metadata.instrument.toLowerCase().replace('_', ' '),
        instrument: project.name,
        type: instrument.type,
        icon: instrument.icon,
        color: instrument.color,
        muted: false,
        solo: false,
        recording: false,
        volume: 75,
        pan: 0
    };
    
    projectData.tracks.push(track);
    
    // Create audio region
    const region = {
        id: 1,
        trackId: 1,
        name: project.name,
        startTime: 20, // Start at the 0 line (first quarter-note at 20px)
        duration: Math.max(160, Math.floor(project.duration * 50)), // Convert seconds to pixels, minimum 2 measures
        type: instrument.type,
        audioFile: project.audioFile
    };
    
    projectData.audioRegions.push(region);
    
    return projectData;
}

// Function to get project preview data for the start page
function getProjectPreviewData() {
    const projects = getLikedSamplesProjects();
    
    return projects.map(project => ({
        id: project.id,
        name: project.name,
        description: `${project.genre} • ${project.bpm} BPM • ${project.style}`,
        date: new Date(project.created).toLocaleDateString(),
        duration: `${project.duration.toFixed(1)}s`,
        size: project.size,
        genre: project.genre,
        bpm: project.bpm,
        style: project.style
    }));
}

// Export functions for use in other modules
window.LikedSamplesLoader = {
    getLikedSamplesProjects,
    loadLikedSampleProject,
    getProjectPreviewData
};