// ====================================
// HBB SUPPORT TOOL - MAIN APPLICATION
// ====================================

// Global State
let currentService = '';
let currentSymptom = '';
let currentStep = null;
let currentFlow = null; // Store reference to entire flow
let stepHistory = [];
let actionHistory = []; // NEW: Track which action buttons were pressed
let decisionTrees = {};
let isAdminMode = false;

// Admin Configuration
const ADMIN_PASSWORD = 'adam123'; 

// ====================================
// SAMPLE DECISION TREE DATA
// ====================================
function initializeDefaultTrees() {
    decisionTrees = {
        'VFS-slow': {
            id: 'VFS-slow',
            service: 'VFS',
            symptom: 'slow',
            root: {
                id: 'step1',
                title: 'Check Device Connection',
                content: 'First, let\'s verify the physical connection between the ONT (Optical Network Terminal) and the customer\'s router.',
                image: null,
                notes: 'Make sure to check both ends of the ethernet cable. Look for any visible damage or loose connections.',
                actions: [
                    { label: 'Connection Secure', nextStep: 'step2' },
                    { label: 'Connection Issue Found', nextStep: 'step3' }
                ],
                children: {
                    'step2': {
                        id: 'step2',
                        title: 'Run Speed Test',
                        content: 'Ask the customer to run a speed test at speedtest.net or fast.com. Record the download and upload speeds.',
                        image: null,
                        notes: 'Compare results against the customer\'s subscribed plan. VFS standard is 100/100 Mbps.',
                        actions: [
                            { label: 'Speed Within Range', nextStep: 'step4' },
                            { label: 'Speed Below Expected', nextStep: 'step5' }
                        ],
                        children: {
                            'step4': {
                                id: 'step4',
                                title: 'Check WiFi vs Wired',
                                content: 'Determine if the customer is testing over WiFi or wired connection. Ask them to test with a direct ethernet connection if possible.',
                                image: null,
                                notes: 'WiFi speeds can be affected by distance, interference, and device limitations.',
                                actions: [
                                    { label: 'Wired Speed Good', nextStep: 'step6' },
                                    { label: 'Both Slow', nextStep: 'step7' }
                                ],
                                children: {
                                    'step6': {
                                        id: 'step6',
                                        title: 'WiFi Optimization',
                                        content: 'The issue is WiFi-related. Recommend:\n- Moving closer to router\n- Reducing interference (microwaves, cordless phones)\n- Upgrading router if it\'s older than 3 years\n- Using 5GHz band instead of 2.4GHz',
                                        image: null,
                                        notes: 'Document the recommendation in the customer account notes.',
                                        actions: [
                                            { label: 'Issue Resolved', nextStep: null }
                                        ],
                                        children: {}
                                    },
                                    'step7': {
                                        id: 'step7',
                                        title: 'Escalate to Network Operations',
                                        content: 'Both wired and wireless speeds are below expected levels. Create a ticket for Network Operations team with:\n- Account details\n- Speed test results\n- Time of tests\n- Troubleshooting steps already taken',
                                        image: null,
                                        notes: 'Priority: Medium. Expected response time: 24 hours.',
                                        actions: [
                                            { label: 'Ticket Created', nextStep: null }
                                        ],
                                        children: {}
                                    }
                                }
                            },
                            'step5': {
                                id: 'step5',
                                title: 'Check for Network Congestion',
                                content: 'Ask customer about:\n- Time of day (peak hours: 6pm-10pm)\n- Number of devices connected\n- Any large downloads or streaming happening\n- Recent changes to home network',
                                image: null,
                                notes: 'Network congestion is common during peak hours in high-density areas.',
                                actions: [
                                    { label: 'Congestion Likely', nextStep: 'step8' },
                                    { label: 'No Congestion Factors', nextStep: 'step7' }
                                ],
                                children: {
                                    'step8': {
                                        id: 'step8',
                                        title: 'Educate on Peak Hours',
                                        content: 'Explain that speeds may vary during peak usage times. Suggest:\n- Testing at off-peak hours (early morning)\n- Prioritizing bandwidth with QoS settings\n- Consider upgrade to higher tier if consistently slow',
                                        image: null,
                                        notes: 'Schedule a follow-up test during off-peak hours to confirm.',
                                        actions: [
                                            { label: 'Customer Understands', nextStep: null }
                                        ],
                                        children: {}
                                    }
                                }
                            }
                        }
                    },
                    'step3': {
                        id: 'step3',
                        title: 'Resolve Connection Issue',
                        content: 'Guide the customer to:\n1. Unplug ethernet cable from both ends\n2. Inspect for damage\n3. Firmly reconnect both ends\n4. Ensure cable clicks into place\n5. Check indicator lights on ONT and router',
                        image: null,
                        notes: 'If cable is damaged, arrange for technician visit to replace.',
                        actions: [
                            { label: 'Connection Fixed', nextStep: 'step2' },
                            { label: 'Cable Damaged', nextStep: 'step9' }
                        ],
                        children: {
                            'step9': {
                                id: 'step9',
                                title: 'Schedule Technician Visit',
                                content: 'Cable replacement required. Schedule a technician visit:\n- Check tech availability\n- Confirm customer availability\n- Send confirmation email\n- Add notes to service order',
                                image: null,
                                notes: 'Standard service call: No charge. Cable replacement is covered under service agreement.',
                                actions: [
                                    { label: 'Visit Scheduled', nextStep: null }
                                ],
                                children: {}
                            }
                        }
                    }
                }
            }
        },
        'VFC-slow': {
            id: 'VFC-slow',
            service: 'VFC',
            symptom: 'slow',
            root: {
                id: 'step1',
                title: 'Initial VFC Speed Assessment',
                content: 'VFC (Video Fiber Connection) requires specific testing:\n- Test streaming quality on primary device\n- Check if buffering occurs\n- Note if issue affects all channels or specific ones\n- Ask about internet speed (if bundled)',
                image: null,
                notes: 'VFC slow speeds can affect video quality. Standard is 1080p without buffering.',
                actions: [
                    { label: 'Video Buffering/Quality Issues', nextStep: 'step2' },
                    { label: 'Internet Speed Issues', nextStep: 'step3' }
                ],
                children: {
                    'step2': {
                        id: 'step2',
                        title: 'Check Set-Top Box Connection',
                        content: 'Verify the set-top box:\n- Direct ethernet connection (not WiFi)\n- Cable properly seated\n- Latest firmware version\n- Adequate ventilation (not overheating)',
                        image: null,
                        notes: 'Set-top boxes can throttle when overheating or on poor connection.',
                        actions: [
                            { label: 'Connection Issues Found', nextStep: 'step4' },
                            { label: 'Connection Appears Normal', nextStep: 'step5' }
                        ],
                        children: {
                            'step4': {
                                id: 'step4',
                                title: 'Resolve Set-Top Box Connection',
                                content: 'Guide customer to:\n1. Use wired connection (no WiFi)\n2. Ensure proper ventilation\n3. Reboot set-top box\n4. Check for firmware updates\n5. Test video quality',
                                image: null,
                                notes: 'WiFi connection to set-top box can cause buffering even with fast internet.',
                                actions: [
                                    { label: 'Issue Resolved', nextStep: null },
                                    { label: 'Still Having Issues', nextStep: 'step5' }
                                ],
                                children: {}
                            },
                            'step5': {
                                id: 'step5',
                                title: 'Test Content Source',
                                content: 'Determine if issue is:\n- Specific channel/service\n- All streaming content\n- Live TV vs On-Demand\n- HD vs SD content',
                                image: null,
                                notes: 'Helps identify if it\'s a content delivery or bandwidth issue.',
                                actions: [
                                    { label: 'Specific Content Only', nextStep: 'step6' },
                                    { label: 'All Content Affected', nextStep: 'step7' }
                                ],
                                children: {
                                    'step6': {
                                        id: 'step6',
                                        title: 'Content Provider Issue',
                                        content: 'Issue is with specific content provider:\n- Check known issues dashboard\n- Test same content on different device\n- Report to content team if needed\n- Suggest alternative content temporarily',
                                        image: null,
                                        notes: 'Document which channels/services are affected.',
                                        actions: [
                                            { label: 'Documented and Reported', nextStep: null }
                                        ],
                                        children: {}
                                    },
                                    'step7': {
                                        id: 'step7',
                                        title: 'Bandwidth Verification',
                                        content: 'Check customer\'s subscribed bandwidth:\n- VFC requires minimum 25 Mbps per stream\n- Check concurrent usage (multiple devices)\n- Run network speed test\n- Verify QoS settings if applicable',
                                        image: null,
                                        notes: 'Multiple HD streams require significant bandwidth.',
                                        actions: [
                                            { label: 'Bandwidth Sufficient', nextStep: 'step8' },
                                            { label: 'Bandwidth Insufficient', nextStep: 'step9' }
                                        ],
                                        children: {
                                            'step8': {
                                                id: 'step8',
                                                title: 'Escalate to VFC Engineering',
                                                content: 'Create technical ticket:\n- All troubleshooting steps taken\n- Speed test results\n- Channels affected\n- Customer subscription level\n- Request signal analysis',
                                                image: null,
                                                notes: 'Priority: Medium. Response: 24-48 hours.',
                                                actions: [
                                                    { label: 'Ticket Created', nextStep: null }
                                                ],
                                                children: {}
                                            },
                                            'step9': {
                                                id: 'step9',
                                                title: 'Upgrade Recommendation',
                                                content: 'Current bandwidth insufficient for VFC usage:\n- Explain bandwidth requirements\n- Recommend appropriate tier upgrade\n- Offer promotional rates if available\n- Process upgrade if customer agrees',
                                                image: null,
                                                notes: 'VFC Premium requires 100 Mbps minimum for optimal experience.',
                                                actions: [
                                                    { label: 'Upgrade Processed', nextStep: null },
                                                    { label: 'Customer Declined', nextStep: null }
                                                ],
                                                children: {}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    'step3': {
                        id: 'step3',
                        title: 'Follow VFS Internet Troubleshooting',
                        content: 'For internet speed issues with VFC service, follow the VFS Slow Speed troubleshooting path.\n\nKey differences for VFC:\n- Ensure QoS prioritizes video traffic\n- Check if video and internet share bandwidth\n- Consider separate connections if bundled',
                        image: null,
                        notes: 'Reference VFS decision tree for detailed internet troubleshooting.',
                        actions: [
                            { label: 'Complete VFS Troubleshooting', nextStep: null }
                        ],
                        children: {}
                    }
                }
            }
        }
    };

    // Save to localStorage
    saveDecisionTrees();
}

// ====================================
// LOCAL STORAGE FUNCTIONS
// ====================================
function saveDecisionTrees() {
    localStorage.setItem('hbb_decision_trees', JSON.stringify(decisionTrees));
}

function loadDecisionTrees() {
    const stored = localStorage.getItem('hbb_decision_trees');
    if (stored) {
        decisionTrees = JSON.parse(stored);
    } else {
        initializeDefaultTrees();
    }
}

// ====================================
// INITIALIZATION
// ====================================
document.addEventListener('DOMContentLoaded', function() {
    loadDecisionTrees();
    setupEventListeners();
});

// ====================================
// EVENT LISTENERS
// ====================================
function setupEventListeners() {
    // Service selection
    document.querySelectorAll('.service-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectService(this.dataset.service);
        });
    });

    // Symptom selection
    document.querySelectorAll('.symptom-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectSymptom(this.dataset.symptom);
        });
    });

    // Back to start
    document.getElementById('backToStart').addEventListener('click', backToStart);
    document.getElementById('backFromConstruction').addEventListener('click', backToStart);

    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportSummary);

    // Admin access
    document.getElementById('adminAccessBtn').addEventListener('click', showAdminLogin);
    document.getElementById('closeAdmin').addEventListener('click', closeAdminPanel);
    document.getElementById('loginForm').addEventListener('submit', handleAdminLogin);
    document.getElementById('cancelLogin').addEventListener('click', closeAdminLogin);

    // Admin panel controls
    document.getElementById('loadFlow').addEventListener('click', loadFlowForEditing);
    document.getElementById('createNewFlow').addEventListener('click', createNewFlow);
    document.getElementById('saveFlow').addEventListener('click', saveCurrentFlow);
    document.getElementById('exportFlow').addEventListener('click', exportFlowJSON);
    document.getElementById('importFlow').addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', importFlowJSON);
    document.getElementById('nodeForm').addEventListener('submit', saveNode);
    document.getElementById('cancelNode').addEventListener('click', closeNodeEditor);
    document.getElementById('addAction').addEventListener('click', addActionField);
}

// ====================================
// SERVICE & SYMPTOM SELECTION
// ====================================
function selectService(service) {
    currentService = service;
    
    // Update UI
    document.querySelectorAll('.service-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // Show symptom selection
    document.getElementById('symptomSelection').style.display = 'block';
}

function selectSymptom(symptom) {
    currentSymptom = symptom;
    
    // Update UI
    document.querySelectorAll('.symptom-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // Start diagnostic flow
    startDiagnosticFlow();
}

// ====================================
// DIAGNOSTIC FLOW - FIXED VERSION
// ====================================
function startDiagnosticFlow() {
    const flowKey = `${currentService}-${currentSymptom}`;
    const flow = decisionTrees[flowKey];
    
    if (!flow) {
        showUnderConstruction();
        return;
    }
    
    // Store reference to entire flow for cross-tree navigation
    currentFlow = flow;
    
    // Hide selection screen
    document.getElementById('selectionScreen').style.display = 'none';
    
    // Show diagnostic screen
    document.getElementById('diagnosticScreen').style.display = 'block';
    document.getElementById('exportBtn').style.display = 'block';
    
    // Update info bar
    document.getElementById('currentService').textContent = `Service: ${currentService}`;
    document.getElementById('currentSymptom').textContent = `Symptom: ${getSymptomLabel(currentSymptom)}`;
    
    // Reset history
    stepHistory = [];
    actionHistory = []; // NEW: Reset action history
    
    // Load first step
    loadStep(flow.root);
}

function loadStep(step, options = {}) {
    const { addToHistory = true } = options;

    currentStep = step;

    if (addToHistory) {
        stepHistory.push(step);
    }
    
    // Update step number
    document.getElementById('stepNumber').textContent = `Step ${stepHistory.length} of Diagnostic Process`;
    
    // Update breadcrumb
    updateBreadcrumb();
    
    // Update content
    const contentDiv = document.getElementById('stepContent');
    let contentHTML = `<h3>${step.title}</h3>`;
    contentHTML += `<p>${step.content.replace(/\n/g, '<br>')}</p>`;
    
    // Add image if present
    if (step.image) {
        contentHTML += `<img src="${step.image}" alt="${step.title}">`;
    }
    
    contentDiv.innerHTML = contentHTML;
    
    // Update PS notes
    if (step.notes) {
        document.getElementById('psNotes').style.display = 'flex';
        document.querySelector('.ps-notes-content').textContent = step.notes;
    } else {
        document.getElementById('psNotes').style.display = 'none';
    }
    
    // Update action buttons
    const actionsDiv = document.getElementById('actionButtons');
    actionsDiv.innerHTML = '';
    
    step.actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = 'action-btn';
        btn.textContent = action.label;
        btn.addEventListener('click', () => handleAction(action));
        actionsDiv.appendChild(btn);
    });
}

// FIXED: Search entire tree for next step, not just children
function handleAction(action) {
    // NEW: Track which action button was pressed
    actionHistory.push(action.label);
    
    if (!action.nextStep) {
        // End of flow
        showCompletionMessage();
        return;
    }
    
    // Search for next step in entire flow tree
    const nextStep = findNode(currentFlow.root, action.nextStep);
    
    if (nextStep) {
        loadStep(nextStep);
    } else {
        console.error('Step not found:', action.nextStep);
        alert('Error: Next step not found in decision tree. Please contact administrator.');
    }
}

function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = '';
    
    stepHistory.forEach((step, index) => {
        const item = document.createElement('span');
        item.className = 'breadcrumb-item';
        if (index === stepHistory.length - 1) {
            item.classList.add('active');
        }
        item.textContent = `Step ${index + 1}`;
        item.addEventListener('click', () => goToHistoryStep(index));
        breadcrumb.appendChild(item);
        
        if (index < stepHistory.length - 1) {
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.textContent = '›';
            breadcrumb.appendChild(separator);
        }
    });
}

function goToHistoryStep(index) {
    // Remove steps after clicked step
    stepHistory = stepHistory.slice(0, index + 1);
    actionHistory = actionHistory.slice(0, index); // NEW: Also trim action history
    
    // Reload that step
    loadStep(stepHistory[stepHistory.length - 1], { addToHistory: false });
}

function showCompletionMessage() {
    const contentDiv = document.getElementById('stepContent');
    contentDiv.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <h3 style="color: var(--success-green); font-size: 24px; margin-bottom: 20px;">✓ Diagnostic Process Complete</h3>
            <p style="font-size: 16px; margin-bottom: 30px;">You have completed all troubleshooting steps for this issue.</p>
            <p style="color: var(--text-light);">Click "Export Summary" to copy the troubleshooting summary to your clipboard, or "Back to Start" to begin a new diagnostic session.</p>
        </div>
    `;
    
    document.getElementById('actionButtons').innerHTML = '';
    document.getElementById('psNotes').style.display = 'none';
}

function showUnderConstruction() {
    document.getElementById('selectionScreen').style.display = 'none';
    document.getElementById('constructionScreen').style.display = 'block';
}

function backToStart() {
    // Reset state
    currentService = '';
    currentSymptom = '';
    currentStep = null;
    currentFlow = null;
    stepHistory = [];
    actionHistory = []; // NEW: Reset action history
    
    // Reset UI
    document.querySelectorAll('.service-btn, .symptom-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    document.getElementById('symptomSelection').style.display = 'none';
    document.getElementById('selectionScreen').style.display = 'flex';
    document.getElementById('diagnosticScreen').style.display = 'none';
    document.getElementById('constructionScreen').style.display = 'none';
    document.getElementById('exportBtn').style.display = 'none';
}

function getSymptomLabel(symptom) {
    const labels = {
        'slow': 'Slow Speeds',
        'intermittent': 'Intermittent Connection',
        'none': 'No Connection'
    };
    return labels[symptom] || symptom;
}

// ====================================
// EXPORT FUNCTIONALITY - NEW VERSION
// ====================================
function exportSummary() {
    const summary = generateTextSummary();
    
    // Copy to clipboard
    navigator.clipboard.writeText(summary).then(() => {
        // Show success message
        alert('✓ Troubleshooting summary copied to clipboard!\n\nYou can now paste it into your notes, ticket system, or any document.');
    }).catch(err => {
        // Fallback for older browsers
        console.error('Clipboard error:', err);
        
        // Create a temporary textarea to copy text
        const textarea = document.createElement('textarea');
        textarea.value = summary;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            alert('✓ Troubleshooting summary copied to clipboard!\n\nYou can now paste it into your notes, ticket system, or any document.');
        } catch (err) {
            alert('Unable to copy to clipboard. Please try again or use a modern browser.');
        }
        
        document.body.removeChild(textarea);
    });
}

function generateTextSummary() {
    const timestamp = new Date().toLocaleString();
    
    // Header
    let summary = `HBB SUPPORT TOOL - DIAGNOSTIC SUMMARY\n`;
    summary += `${'='.repeat(60)}\n\n`;
    
    // Meta info
    summary += `Service Type: ${currentService}\n`;
    summary += `Symptom: ${getSymptomLabel(currentSymptom)}\n`;
    summary += `Date/Time: ${timestamp}\n`;
    summary += `Total Steps: ${stepHistory.length}\n\n`;
    
    summary += `${'='.repeat(60)}\n\n`;
    
    // Steps with actions
    stepHistory.forEach((step, index) => {
        summary += `STEP ${index + 1}\n`;
        summary += `${step.content}\n`;
        
        // Only add "Action Taken" if:
        // 1. Not the last step (there was an action)
        // 2. The step had 2 or more action choices
        if (index < actionHistory.length && step.actions && step.actions.length >= 2) {
            summary += `\n→ Action Taken: ${actionHistory[index]}\n`;
        }
        
        summary += `\n`;
    });
    
    summary += `${'='.repeat(60)}\n`;
    summary += `End of Diagnostic Summary\n`;
    
    return summary;
}

// ====================================
// ADMIN PANEL FUNCTIONS
// ====================================
function showAdminLogin() {
    document.getElementById('adminLogin').style.display = 'flex';
    document.getElementById('adminPassword').focus();
}

function closeAdminLogin() {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminPassword').value = '';
}

function handleAdminLogin(e) {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value;
    
    if (password === ADMIN_PASSWORD) {
        isAdminMode = true;
        closeAdminLogin();
        showAdminPanel();
    } else {
        alert('Incorrect password. Please try again.');
        document.getElementById('adminPassword').value = '';
    }
}

function showAdminPanel() {
    document.getElementById('adminPanel').style.display = 'flex';
}

function closeAdminPanel() {
    document.getElementById('adminPanel').style.display = 'none';
}

function loadFlowForEditing() {
    const service = document.getElementById('adminService').value;
    const symptom = document.getElementById('adminSymptom').value;
    
    if (!service || !symptom) {
        alert('Please select both service and symptom.');
        return;
    }
    
    const flowKey = `${service}-${symptom}`;
    const flow = decisionTrees[flowKey];
    
    const editorDiv = document.getElementById('flowEditor');
    
    if (!flow) {
        editorDiv.innerHTML = '<p class="placeholder-text">No flow exists for this combination. Click "Create New Flow" to start.</p>';
        return;
    }
    
    // Render flow tree
    editorDiv.innerHTML = '<ul class="flow-tree">' + renderFlowNode(flow.root, flowKey) + '</ul>';
}

function renderFlowNode(node, flowKey) {
    let html = `
        <li class="flow-node">
            <div class="flow-node-header">
                <span class="flow-node-title">${node.title}</span>
                <div class="flow-node-actions">
                    <button class="edit-node-btn" onclick="editNode('${flowKey}', '${node.id}')">Edit</button>
                    <button class="add-child-btn" onclick="addChildNode('${flowKey}', '${node.id}')">Add Child</button>
                    <button class="delete-node-btn" onclick="deleteNode('${flowKey}', '${node.id}')">Delete</button>
                </div>
            </div>
            <div class="flow-node-content">${node.content.substring(0, 100)}${node.content.length > 100 ? '...' : ''}</div>
    `;
    
    if (node.children && Object.keys(node.children).length > 0) {
        html += '<ul class="flow-node-children">';
        for (const childId in node.children) {
            html += renderFlowNode(node.children[childId], flowKey);
        }
        html += '</ul>';
    }
    
    html += '</li>';
    return html;
}

function createNewFlow() {
    const service = document.getElementById('adminService').value;
    const symptom = document.getElementById('adminSymptom').value;
    
    if (!service || !symptom) {
        alert('Please select both service and symptom first.');
        return;
    }
    
    const flowKey = `${service}-${symptom}`;
    
    if (decisionTrees[flowKey]) {
        if (!confirm('A flow already exists for this combination. Do you want to replace it?')) {
            return;
        }
    }
    
    // Create new flow with initial root node
    decisionTrees[flowKey] = {
        id: flowKey,
        service: service,
        symptom: symptom,
        root: {
            id: 'step1',
            title: 'Initial Step',
            content: 'Enter diagnostic step content here.',
            image: null,
            notes: '',
            actions: [],
            children: {}
        }
    };
    
    saveDecisionTrees();
    loadFlowForEditing();
    alert('New flow created! Click "Edit" to customize the initial step.');
}

function editNode(flowKey, nodeId) {
    const flow = decisionTrees[flowKey];
    const node = findNode(flow.root, nodeId);
    
    if (!node) {
        alert('Node not found.');
        return;
    }
    
    // Populate form
    document.getElementById('nodeId').value = nodeId;
    document.getElementById('nodeTitle').value = node.title;
    document.getElementById('nodeContent').value = node.content;
    document.getElementById('nodeImage').value = node.image || '';
    document.getElementById('nodeNotes').value = node.notes || '';
    
    // Populate actions
    const actionsList = document.getElementById('actionsList');
    actionsList.innerHTML = '';
    
    node.actions.forEach((action, index) => {
        addActionField(action.label, action.nextStep, flowKey);
    });
    
    // Show editor
    document.getElementById('nodeEditorTitle').textContent = 'Edit Step';
    document.getElementById('nodeEditor').style.display = 'block';
    
    // Store current flow key for saving
    document.getElementById('nodeEditor').dataset.flowKey = flowKey;
}

function addChildNode(flowKey, parentId) {
    const flow = decisionTrees[flowKey];
    const parentNode = findNode(flow.root, parentId);
    
    if (!parentNode) {
        alert('Parent node not found.');
        return;
    }
    
    // Generate new child ID
    const newId = 'step' + Date.now();
    
    // Create new child
    const newChild = {
        id: newId,
        title: 'New Step',
        content: 'Enter step content here.',
        image: null,
        notes: '',
        actions: [],
        children: {}
    };
    
    parentNode.children[newId] = newChild;
    
    // Add action to parent if not exists
    if (!parentNode.actions.some(a => a.nextStep === newId)) {
        parentNode.actions.push({
            label: 'Continue',
            nextStep: newId
        });
    }
    
    saveDecisionTrees();
    loadFlowForEditing();
    
    // Open editor for new node
    editNode(flowKey, newId);
}

function deleteNode(flowKey, nodeId) {
    if (nodeId === 'step1') {
        alert('Cannot delete the root node.');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this step and all its children?')) {
        return;
    }
    
    const flow = decisionTrees[flowKey];
    removeNodeById(flow.root, nodeId);
    
    saveDecisionTrees();
    loadFlowForEditing();
}

// IMPROVED: This function now searches the entire tree
function findNode(node, targetId) {
    if (node.id === targetId) {
        return node;
    }
    
    for (const childId in node.children) {
        const found = findNode(node.children[childId], targetId);
        if (found) return found;
    }
    
    return null;
}

function removeNodeById(node, targetId) {
    // Remove from children
    if (node.children && node.children[targetId]) {
        delete node.children[targetId];
    }
    
    // Remove actions pointing to this node
    if (node.actions) {
        node.actions = node.actions.filter(a => a.nextStep !== targetId);
    }
    
    // Recurse
    for (const childId in node.children) {
        removeNodeById(node.children[childId], targetId);
    }
}

function addActionField(label = '', nextStep = '', flowKey = null) {
    const actionsList = document.getElementById('actionsList');
    
    const actionDiv = document.createElement('div');
    actionDiv.className = 'action-item';
    
    actionDiv.innerHTML = `
        <input type="text" placeholder="Button Label" value="${label}" class="action-label">
        <select class="action-next">
            <option value="">-- End Flow --</option>
            <option value="new">-- Create New Step --</option>
        </select>
        <button type="button" class="remove-action-btn" onclick="this.parentElement.remove()">Remove</button>
    `;
    
    // Populate available next steps - FIXED to show ALL steps in tree
    if (!flowKey) {
        flowKey = document.getElementById('nodeEditor').dataset.flowKey;
    }
    const currentNodeId = document.getElementById('nodeId').value;
    if (flowKey) {
        const flow = decisionTrees[flowKey];
        const select = actionDiv.querySelector('.action-next');
        populateNextStepOptions(select, flow.root, currentNodeId);
        if (nextStep) {
            select.value = nextStep;
        }
    }
    
    actionsList.appendChild(actionDiv);
}

function populateNextStepOptions(selectElement, node, excludeId) {
    if (node.id !== excludeId) {
        const option = document.createElement('option');
        option.value = node.id;
        option.textContent = `${node.id} - ${node.title}`;
        selectElement.appendChild(option);
    }
    
    for (const childId in node.children) {
        populateNextStepOptions(selectElement, node.children[childId], excludeId);
    }
}

function saveNode(e) {
    e.preventDefault();
    
    const flowKey = document.getElementById('nodeEditor').dataset.flowKey;
    const nodeId = document.getElementById('nodeId').value;
    const flow = decisionTrees[flowKey];
    const node = findNode(flow.root, nodeId);
    
    if (!node) {
        alert('Node not found.');
        return;
    }
    
    // Update node data
    node.title = document.getElementById('nodeTitle').value;
    node.content = document.getElementById('nodeContent').value;
    node.image = document.getElementById('nodeImage').value || null;
    node.notes = document.getElementById('nodeNotes').value || '';
    
    // Update actions
    node.actions = [];
    document.querySelectorAll('.action-item').forEach(item => {
        const label = item.querySelector('.action-label').value;
        let nextStep = item.querySelector('.action-next').value;
        
        if (nextStep === 'new') {
            // Create new child step
            const newId = 'step' + Date.now();
            const newChild = {
                id: newId,
                title: 'New Step',
                content: 'Enter step content here.',
                image: null,
                notes: '',
                actions: [],
                children: {}
            };
            node.children[newId] = newChild;
            nextStep = newId;
        }
        
        if (label) {
            node.actions.push({
                label: label,
                nextStep: nextStep || null
            });
        }
    });
    
    saveDecisionTrees();
    closeNodeEditor();
    loadFlowForEditing();
    alert('Step saved successfully!');
}

function closeNodeEditor() {
    document.getElementById('nodeEditor').style.display = 'none';
    document.getElementById('nodeForm').reset();
    document.getElementById('actionsList').innerHTML = '';
}

function saveCurrentFlow() {
    saveDecisionTrees();
    alert('All changes saved successfully!');
}

function exportFlowJSON() {
    const service = document.getElementById('adminService').value;
    const symptom = document.getElementById('adminSymptom').value;
    
    if (!service || !symptom) {
        alert('Please select a flow to export.');
        return;
    }
    
    const flowKey = `${service}-${symptom}`;
    const flow = decisionTrees[flowKey];
    
    if (!flow) {
        alert('No flow found for this combination.');
        return;
    }
    
    const dataStr = JSON.stringify(flow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${flowKey}-flow.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

function importFlowJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const flow = JSON.parse(event.target.result);
            
            // Validate flow structure
            if (!flow.id || !flow.service || !flow.symptom || !flow.root) {
                alert('Invalid flow file format.');
                return;
            }
            
            const flowKey = `${flow.service}-${flow.symptom}`;
            
            if (decisionTrees[flowKey]) {
                if (!confirm(`A flow already exists for ${flow.service} - ${flow.symptom}. Replace it?`)) {
                    return;
                }
            }
            
            decisionTrees[flowKey] = flow;
            saveDecisionTrees();
            
            // Update selectors
            document.getElementById('adminService').value = flow.service;
            document.getElementById('adminSymptom').value = flow.symptom;
            
            loadFlowForEditing();
            alert('Flow imported successfully!');
            
        } catch (error) {
            alert('Error parsing JSON file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    e.target.value = '';
}
