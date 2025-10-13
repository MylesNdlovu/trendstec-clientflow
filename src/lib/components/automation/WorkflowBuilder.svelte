<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable, derived } from 'svelte/store';
	import {
		SvelteFlow,
		Controls,
		Background,
		type Node,
		type Edge,
		ConnectionMode,
		type Connection
	} from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';

	// Custom node components
	import TriggerNode from './nodes/TriggerNode.svelte';
	import ActionNode from './nodes/ActionNode.svelte';
	import ConditionNode from './nodes/ConditionNode.svelte';
	import DelayNode from './nodes/DelayNode.svelte';

	// Props
	export let workflowData = {
		nodes: [],
		edges: [],
		name: '',
		description: ''
	};
	export let templates = [];
	export let onSave = () => {};
	export let onNodeSelect = () => {};

	// Node types mapping
	const nodeTypes = {
		trigger: TriggerNode,
		action: ActionNode,
		condition: ConditionNode,
		delay: DelayNode
	};

	// Workflow state management
	const nodes = writable<Node[]>([]);
	const edges = writable<Edge[]>([]);
	const selectedNode = writable<Node | null>(null);
	const workflowConfig = writable({
		name: workflowData.name || 'New Automation',
		description: workflowData.description || '',
		isActive: false
	});

	// Derived state for workflow validation and trigger checking
	const isValidWorkflow = derived(
		[nodes, edges],
		([$nodes, $edges]) => {
			// Must have at least one trigger
			const triggers = $nodes.filter(n => n.type === 'trigger');
			if (triggers.length === 0) return false;

			// All nodes must be connected
			const connectedNodes = new Set();
			$edges.forEach(edge => {
				connectedNodes.add(edge.source);
				connectedNodes.add(edge.target);
			});

			// Check if all non-trigger nodes are connected
			const nonTriggerNodes = $nodes.filter(n => n.type !== 'trigger');
			return nonTriggerNodes.every(node => connectedNodes.has(node.id));
		}
	);

	// Check if trigger exists to enable/disable other buttons
	const hasTrigger = derived(
		nodes,
		($nodes) => $nodes.some(n => n.type === 'trigger')
	);

	// Initialize workflow
	onMount(() => {
		if (workflowData.nodes?.length > 0) {
			// Add delete function to existing nodes
			const nodesWithProps = workflowData.nodes.map(node => ({
				...node,
				data: {
					...node.data,
					onDelete: deleteNode
				}
			}));
			nodes.set(nodesWithProps);
			edges.set(workflowData.edges || []);
		}
	});

	// Node creation functions
	function createNode(type: string, position: { x: number, y: number }, data = {}) {
		const nodeId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		const newNode: Node = {
			id: nodeId,
			type,
			position,
			data: {
				...getDefaultNodeData(type),
				...data,
				id: nodeId,
				onDelete: deleteNode
			}
		};

		nodes.update(ns => [...ns, newNode]);

		// Auto-select newly created node for immediate configuration
		selectedNode.set(newNode);

		return newNode;
	}

	function getDefaultNodeData(type: string) {
		switch (type) {
			case 'trigger':
				return {
					label: 'New Trigger',
					triggerType: 'form_submission',
					config: {}
				};
			case 'action':
				return {
					label: 'New Action',
					actionType: 'email',
					templateId: null,
					config: {}
				};
			case 'condition':
				return {
					label: 'New Condition',
					field: '',
					operator: 'equals',
					value: '',
					config: {}
				};
			case 'delay':
				return {
					label: 'Wait',
					duration: 1,
					unit: 'hours',
					config: {}
				};
			default:
				return { label: 'Unknown Node' };
		}
	}

	// Connection handling
	function onConnect(connection: Connection) {
		console.log('🔗 Connection attempt:', connection);
		const { source, target, sourceHandle, targetHandle } = connection;

		// Validate connection logic
		if (!isValidConnection(source, target)) {
			console.warn('❌ Invalid connection attempted:', { source, target });
			return;
		}

		console.log('✅ Valid connection, creating edge...');

		const edgeId = `${source}-${target}`;
		const newEdge: Edge = {
			id: edgeId,
			source,
			target,
			sourceHandle,
			targetHandle,
			type: 'step',
			animated: false,
			style: {
				stroke: sourceHandle === 'condition-yes' ? '#10b981' : sourceHandle === 'condition-no' ? '#ef4444' : '#3b82f6',
				strokeWidth: 3,
				strokeDasharray: '0'
			},
			markerEnd: {
				type: 'arrowclosed',
				color: sourceHandle === 'condition-yes' ? '#10b981' : sourceHandle === 'condition-no' ? '#ef4444' : '#3b82f6',
				width: 10,
				height: 10
			},
			data: {
				condition: sourceHandle === 'condition-yes' ? 'true' : sourceHandle === 'condition-no' ? 'false' : null,
				flowType: 'user',
				label: sourceHandle === 'condition-yes' ? 'YES' : sourceHandle === 'condition-no' ? 'NO' : ''
			}
		};

		edges.update(es => [...es, newEdge]);
		console.log('🔗 Edge created successfully:', newEdge);
	}

	function isValidConnection(sourceId: string, targetId: string): boolean {
		const sourceNode = $nodes.find(n => n.id === sourceId);
		const targetNode = $nodes.find(n => n.id === targetId);

		if (!sourceNode || !targetNode) return false;

		// Triggers can connect to any action/condition
		if (sourceNode.type === 'trigger') {
			return ['action', 'condition', 'delay'].includes(targetNode.type);
		}

		// Actions can connect to other actions, conditions, or delays
		if (sourceNode.type === 'action') {
			return ['action', 'condition', 'delay'].includes(targetNode.type);
		}

		// Conditions can connect to actions or delays
		if (sourceNode.type === 'condition') {
			return ['action', 'delay'].includes(targetNode.type);
		}

		// Delays can connect to actions or conditions
		if (sourceNode.type === 'delay') {
			return ['action', 'condition'].includes(targetNode.type);
		}

		return false;
	}

	// Node selection
	function onNodeClick(event: CustomEvent) {
		const node = event.detail.node;
		selectedNode.set(node);
		onNodeSelect(node);
	}

	// Node deletion
	function deleteSelectedNode() {
		const selected = $selectedNode;
		if (!selected) return;

		deleteNodeWithHistory(selected.id);
		selectedNode.set(null);
	}

	// Delete node by ID (for node buttons)
	function deleteNode(nodeId: string) {
		// Remove node
		nodes.update(ns => ns.filter(n => n.id !== nodeId));

		// Remove connected edges
		edges.update(es => es.filter(e =>
			e.source !== nodeId && e.target !== nodeId
		));

		// Clear selection if deleted node was selected
		if ($selectedNode?.id === nodeId) {
			selectedNode.set(null);
		}
	}

	// Save node changes and apply them
	function saveNodeChanges() {
		console.log('💾 Saving node changes...');
		const selected = $selectedNode;
		if (!selected) {
			console.error('❌ No node selected to save');
			showError('No node selected to save');
			return;
		}

		console.log('📋 Selected node data:', selected);

		try {
			// Validate node configuration before saving
			const validation = validateNodeConfiguration(selected);
			console.log('✅ Validation result:', validation);
			if (!validation.isValid) {
				console.error('❌ Validation failed:', validation.errors);
				showError(`Configuration error: ${validation.errors.join(', ')}`);
				return;
			}

			// Update the node in the store with current values
			nodes.update(ns =>
				ns.map(n => n.id === selected.id ? { ...selected } : n)
			);

			// Show success feedback
			console.log('✅ Node changes saved successfully');
			showSuccess('✓ Node changes applied successfully');

		} catch (error) {
			console.error('❌ Error saving node changes:', error);
			showError('Failed to save node changes. Please try again.');
		}
	}

	// Node configuration validation
	function validateNodeConfiguration(node: any) {
		const errors: string[] = [];

		switch (node.type) {
			case 'trigger':
				if (!node.data.triggerType) {
					errors.push('Trigger type is required');
				}
				break;
			case 'action':
				if (!node.data.actionType) {
					errors.push('Action type is required');
				}
				if (['email', 'sms', 'dm'].includes(node.data.actionType) && !node.data.templateId) {
					errors.push('Template selection is required for this action type');
				}
				break;
			case 'condition':
				if (!node.data.field) {
					errors.push('Condition field is required');
				}
				if (!node.data.operator) {
					errors.push('Condition operator is required');
				}
				if (node.data.value === '' || node.data.value === undefined) {
					errors.push('Condition value is required');
				}
				break;
			case 'delay':
				if (!node.data.duration || node.data.duration < 1) {
					errors.push('Duration must be at least 1');
				}
				if (!node.data.unit) {
					errors.push('Time unit is required');
				}
				break;
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}

	// User feedback functions
	let notifications = writable([]);

	function showSuccess(message: string) {
		const id = Date.now();
		notifications.update(n => [...n, { id, type: 'success', message }]);
		setTimeout(() => {
			notifications.update(n => n.filter(notif => notif.id !== id));
		}, 3000);
	}

	function showError(message: string) {
		const id = Date.now();
		notifications.update(n => [...n, { id, type: 'error', message }]);
		setTimeout(() => {
			notifications.update(n => n.filter(notif => notif.id !== id));
		}, 5000);
	}

	function showInfo(message: string) {
		const id = Date.now();
		notifications.update(n => [...n, { id, type: 'info', message }]);
		setTimeout(() => {
			notifications.update(n => n.filter(notif => notif.id !== id));
		}, 3000);
	}

	// Undo/Redo functionality
	let history = writable([]);
	let historyIndex = writable(-1);
	const maxHistorySize = 50;

	// Save current state to history
	function saveToHistory(action: string) {
		const currentState = {
			nodes: $nodes,
			edges: $edges,
			timestamp: Date.now(),
			action
		};

		history.update(h => {
			const newHistory = h.slice(0, $historyIndex + 1);
			newHistory.push(currentState);

			// Limit history size
			if (newHistory.length > maxHistorySize) {
				newHistory.shift();
			}

			return newHistory;
		});

		historyIndex.update(i => Math.min(i + 1, maxHistorySize - 1));
	}

	// Undo last action
	function undo() {
		if ($historyIndex <= 0) return;

		historyIndex.update(i => i - 1);
		const state = $history[$historyIndex];

		if (state) {
			nodes.set([...state.nodes]);
			edges.set([...state.edges]);
			showSuccess(`Undid: ${state.action}`);
		}
	}

	// Redo last undone action
	function redo() {
		if ($historyIndex >= $history.length - 1) return;

		historyIndex.update(i => i + 1);
		const state = $history[$historyIndex];

		if (state) {
			nodes.set([...state.nodes]);
			edges.set([...state.edges]);
			showSuccess(`Redid: ${state.action}`);
		}
	}

	// Enhanced node creation with history and intelligent auto-positioning
	function createNodeWithHistory(type: string, position: { x: number, y: number }, data = {}) {
		// Use intelligent positioning instead of basic positioning
		const smartPosition = getSmartPosition(type);
		const node = createNode(type, smartPosition, data);

		// Auto-connect to previous node if it makes sense
		autoConnectNode(node);

		saveToHistory(`Create ${type} node`);
		return node;
	}

	// GoHighLevel-style vertical positioning system
	function getSmartPosition(nodeType: string) {
		const currentNodes = $nodes;
		const baseX = 400; // Center column for main vertical flow
		const nodeSpacing = 120; // Tighter spacing like GoHighLevel
		const startY = 100; // Top starting position

		// If no nodes exist, place at the top
		if (currentNodes.length === 0) {
			return { x: baseX, y: startY };
		}

		// Sort all nodes by Y position to find the bottom-most node
		const sortedNodes = currentNodes
			.filter(n => Math.abs(n.position.x - baseX) < 50) // Only consider main column
			.sort((a, b) => b.position.y - a.position.y); // Bottom to top

		if (sortedNodes.length === 0) {
			// No nodes in main column, start fresh
			return { x: baseX, y: startY };
		}

		const bottomNode = sortedNodes[0];

		// Always position in perfectly vertical line
		return {
			x: baseX, // Always center column for perfect vertical flow
			y: bottomNode.position.y + nodeSpacing
		};
	}

	// Intelligent auto-connection with supreme logic
	function autoConnectNode(newNode: any) {
		console.log('🔄 Auto-connecting node:', newNode.id, newNode.type);

		// Wait a bit to ensure the node is fully added to the store
		setTimeout(() => {
			const currentNodes = $nodes;
			const currentEdges = $edges;

			console.log('Current nodes in store:', currentNodes.length);

			// Find the best connection candidate using intelligent logic
			const connectionCandidate = findBestConnectionCandidate(newNode, currentNodes);

			if (connectionCandidate) {
				const { sourceNode, handleId } = connectionCandidate;
				console.log(`🎯 Smart connection: ${sourceNode.type}(${sourceNode.id}) → ${newNode.type}(${newNode.id})`);

				// Check if this specific connection already exists
				const connectionExists = currentEdges.some(e =>
					e.source === sourceNode.id && e.target === newNode.id && e.sourceHandle === handleId
				);

				if (!connectionExists && isValidConnection(sourceNode.id, newNode.id)) {
					// Create intelligent connection
					const edgeId = `smart-${sourceNode.id}-${newNode.id}`;
					const connectionType = getConnectionType(sourceNode, newNode, handleId);

					const newEdge = {
						id: edgeId,
						source: sourceNode.id,
						target: newNode.id,
						sourceHandle: handleId,
						type: 'step',
						animated: false,
						style: {
							stroke: connectionType.color,
							strokeWidth: 3,
							strokeDasharray: '0'
						},
						markerEnd: {
							type: 'arrowclosed',
							color: connectionType.color,
							width: 10,
							height: 10
						},
						data: {
							autoGenerated: true,
							flowType: connectionType.type,
							label: connectionType.label
						}
					};

					console.log('Creating smart edge:', newEdge);
					edges.update(es => [...es, newEdge]);

					// Show intelligent feedback
					setTimeout(() => {
						showSuccess(`✅ ${connectionType.message}`);
					}, 200);
				}
			} else {
				console.log('ℹ️ No suitable connection candidate found');
			}
		}, 100);
	}

	// Find the best connection candidate using supreme logic
	function findBestConnectionCandidate(newNode: any, currentNodes: any[]) {
		if (currentNodes.length <= 1) return null;

		// Get all potential source nodes (excluding the new node)
		const potentialSources = currentNodes.filter(n => n.id !== newNode.id);

		// Strategy 1: Connect to the most recent node that can connect to this type
		const recentCompatible = potentialSources
			.filter(n => isValidConnection(n.id, newNode.id))
			.sort((a, b) => b.position.y - a.position.y)[0];

		if (recentCompatible) {
			// For condition nodes, determine the best handle
			if (recentCompatible.type === 'condition') {
				// Check if there's already a YES connection
				const hasYesConnection = $edges.some(e =>
					e.source === recentCompatible.id && e.sourceHandle === 'condition-yes'
				);

				// Use NO path if YES is taken, otherwise use YES (default path)
				const handleId = hasYesConnection ? 'condition-no' : 'condition-yes';
				return { sourceNode: recentCompatible, handleId };
			} else {
				// Regular connection for non-condition nodes
				return { sourceNode: recentCompatible, handleId: null };
			}
		}

		return null;
	}

	// Get connection type and styling based on source and target
	function getConnectionType(sourceNode: any, targetNode: any, handleId: string | null) {
		if (sourceNode.type === 'condition') {
			if (handleId === 'condition-yes') {
				return {
					color: '#22c55e',
					type: 'yes-branch',
					label: 'YES',
					message: `Connected to YES branch`
				};
			} else if (handleId === 'condition-no') {
				return {
					color: '#ef4444',
					type: 'no-branch',
					label: 'NO',
					message: `Connected to NO branch`
				};
			}
		}

		// Default connection styling - clean blue like GoHighLevel
		return {
			color: '#3b82f6',
			type: 'main-flow',
			label: '',
			message: `Connected ${sourceNode.type} to ${targetNode.type}`
		};
	}

	// Arrange all nodes in perfect vertical GoHighLevel style
	function arrangeVertically() {
		console.log('📐 Arranging nodes in vertical GoHighLevel style...');
		const currentNodes = $nodes;
		if (currentNodes.length === 0) return;

		const baseX = 400; // Perfect center column
		const nodeSpacing = 120; // Tight spacing like GoHighLevel
		const startY = 100;

		let updatedNodes: any[] = [];
		let currentY = startY;

		// Sort nodes by creation order or current Y position for consistent arrangement
		const sortedNodes = [...currentNodes].sort((a, b) => {
			// Triggers first, then others by Y position
			if (a.type === 'trigger' && b.type !== 'trigger') return -1;
			if (b.type === 'trigger' && a.type !== 'trigger') return 1;
			return a.position.y - b.position.y;
		});

		// Arrange all nodes in perfect vertical line
		sortedNodes.forEach((node, index) => {
			updatedNodes.push({
				...node,
				position: { x: baseX, y: currentY }, // Always center X
				data: {
					...node.data,
					flowPosition: index + 1,
					flowTotal: currentNodes.length,
					isFirst: index === 0,
					isLast: index === currentNodes.length - 1
				}
			});

			currentY += nodeSpacing;
		});

		nodes.set(updatedNodes);
		showSuccess('✅ Nodes arranged in perfect vertical flow');
	}

	// Preview flow execution (visual simulation)
	function previewFlowExecution() {
		console.log('🎬 Previewing flow execution...');
		const sortedNodes = [...$nodes].sort((a, b) => a.position.y - b.position.y);
		if (sortedNodes.length === 0) {
			showError('No nodes to preview');
			return;
		}

		let currentStep = 0;
		const stepInterval = setInterval(() => {
			if (currentStep >= sortedNodes.length) {
				clearInterval(stepInterval);
				showSuccess('✅ Flow preview completed');
				return;
			}

			const currentNode = sortedNodes[currentStep];
			console.log(`Step ${currentStep + 1}: Executing ${currentNode.type} - ${currentNode.id}`);

			// Visual feedback - temporarily highlight the current node
			nodes.update(ns => ns.map(n => ({
				...n,
				data: {
					...n.data,
					isExecuting: n.id === currentNode.id,
					wasExecuted: sortedNodes.slice(0, currentStep).some(sn => sn.id === n.id)
				}
			})));

			currentStep++;
		}, 1000); // 1 second per step

		showInfo('🎬 Starting flow preview...');
	}

	// Connect all nodes vertically in sequence
	function connectAllVertically() {
		console.log('🔗 Connecting all nodes vertically...');
		const currentNodes = $nodes;
		if (currentNodes.length < 2) {
			showError('Need at least 2 nodes to create connections');
			return;
		}

		// Sort all nodes by Y position (top to bottom)
		const sortedNodes = [...currentNodes].sort((a, b) => a.position.y - b.position.y);
		let connectionsCreated = 0;

		// Connect each node to the next one in sequence
		for (let i = 0; i < sortedNodes.length - 1; i++) {
			const sourceNode = sortedNodes[i];
			const targetNode = sortedNodes[i + 1];

			// Check if connection already exists
			const connectionExists = $edges.some(e =>
				e.source === sourceNode.id && e.target === targetNode.id
			);

			console.log(`Checking connection: ${sourceNode.type} → ${targetNode.type}, exists: ${connectionExists}, valid: ${isValidConnection(sourceNode.id, targetNode.id)}`);

			if (!connectionExists && isValidConnection(sourceNode.id, targetNode.id)) {
				const edgeId = `manual-${sourceNode.id}-${targetNode.id}`;
				const newEdge = {
					id: edgeId,
					source: sourceNode.id,
					target: targetNode.id,
					type: 'step',
					animated: false,
					style: {
						stroke: '#3b82f6',
						strokeWidth: 3,
						strokeDasharray: '0'
					},
					markerEnd: {
						type: 'arrowclosed',
						color: '#3b82f6',
						width: 10,
						height: 10
					},
					data: {
						manualConnection: true,
						flowType: 'manual',
						label: ''
					}
				};

				console.log(`Creating manual connection: ${sourceNode.type} → ${targetNode.type}`);
				edges.update(es => [...es, newEdge]);
				connectionsCreated++;
			}
		}

		if (connectionsCreated > 0) {
			showSuccess(`✅ Created ${connectionsCreated} vertical connections`);
			saveToHistory(`Connect ${connectionsCreated} nodes vertically`);
		} else {
			showError('❌ No new connections could be created');
		}
	}

	// Enhanced node deletion with history
	function deleteNodeWithHistory(nodeId: string) {
		const nodeName = $nodes.find(n => n.id === nodeId)?.data?.label || 'node';
		deleteNode(nodeId);
		saveToHistory(`Delete ${nodeName}`);
	}

	// Workflow persistence
	const STORAGE_KEY = 'workflow-builder-state';

	// Enhanced auto-save with connection preservation
	function autoSave() {
		if (typeof window === 'undefined') return;

		// Ensure all node data includes onDelete function
		const persistentNodes = $nodes.map(node => ({
			...node,
			data: {
				...node.data,
				// Remove function references for storage but keep all other data
				onDelete: undefined
			}
		}));

		const state = {
			nodes: persistentNodes,
			edges: $edges, // Edges are fully serializable
			workflow: $workflowConfig,
			lastSaved: Date.now(),
			version: '2.0' // Version for future compatibility
		};

		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
			console.log('🔄 Auto-saved workflow:', state.nodes.length, 'nodes,', state.edges.length, 'edges');
		} catch (error) {
			console.warn('Failed to auto-save workflow:', error);
		}
	}

	// Enhanced load function with connection restoration
	function loadWorkflow() {
		if (typeof window === 'undefined') return;

		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const state = JSON.parse(saved);
				console.log('🔄 Loading workflow:', state);

				if (state.nodes && Array.isArray(state.nodes)) {
					// Restore nodes with onDelete function
					const restoredNodes = state.nodes.map(node => ({
						...node,
						data: {
							...node.data,
							onDelete: deleteNode // Restore function reference
						}
					}));

					nodes.set(restoredNodes);
					console.log('✅ Restored', restoredNodes.length, 'nodes');
				}

				if (state.edges && Array.isArray(state.edges)) {
					edges.set(state.edges);
					console.log('✅ Restored', state.edges.length, 'connections');
				}

				if (state.workflow) {
					workflowConfig.set(state.workflow);
				}

				showSuccess(`✅ Workflow restored: ${state.nodes?.length || 0} nodes, ${state.edges?.length || 0} connections`);
			}
		} catch (error) {
			console.warn('Failed to load saved workflow:', error);
		}
	}

	// Export workflow to JSON
	function exportWorkflow() {
		const workflow = {
			nodes: $nodes,
			edges: $edges,
			metadata: {
				name: 'Workflow Export',
				created: Date.now(),
				version: '1.0'
			}
		};

		const blob = new Blob([JSON.stringify(workflow, null, 2)], {
			type: 'application/json'
		});

		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'workflow.json';
		a.click();
		URL.revokeObjectURL(url);

		showSuccess('Workflow exported successfully');
	}

	// Import workflow from JSON
	function importWorkflow(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const workflow = JSON.parse(e.target?.result as string);
				if (workflow.nodes && workflow.edges) {
					nodes.set(workflow.nodes);
					edges.set(workflow.edges);
					showSuccess('Workflow imported successfully');
					// Save initial state to history
					saveToHistory('Import workflow');
				} else {
					showError('Invalid workflow file format');
				}
			} catch (error) {
				showError('Failed to import workflow');
			}
		};
		reader.readAsText(file);
	}

	// Node update with template validation
	function updateNode(nodeId: string, updates: any) {
		nodes.update(ns => ns.map(n => {
			if (n.id === nodeId) {
				const updatedData = { ...n.data, ...updates };

				// If this is an action node and template is being updated, validate template exists
				if (n.type === 'action' && updates.templateId) {
					const template = templates.find(t => t.id === updates.templateId);
					if (template && template.type === updatedData.actionType) {
						updatedData.templateValid = true;
						updatedData.templateName = template.name;
					} else {
						updatedData.templateValid = false;
						updatedData.templateId = null;
					}
				}

				return { ...n, data: updatedData };
			}
			return n;
		}));
	}

	// Enhanced workflow execution simulation
	function simulateWorkflow() {
		console.log('🚀 Starting workflow simulation...');
		const triggers = $nodes.filter(n => n.type === 'trigger');

		if (triggers.length === 0) {
			console.log('⚠️ No trigger nodes found');
			return;
		}

		// Simulate with mock lead data
		const mockLead = {
			id: 'lead-' + Date.now(),
			email: 'test@example.com',
			name: 'Test User',
			source: 'simulation',
			metadata: {}
		};

		triggers.forEach(trigger => {
			console.log(`🎯 Trigger activated: ${trigger.data.label || trigger.data.triggerType}`);
			executeFromNode(trigger.id, { lead: mockLead, timestamp: new Date().toISOString() });
		});
	}

	function executeFromNode(nodeId: string, context: any) {
		const node = $nodes.find(n => n.id === nodeId);
		if (!node) return;

		console.log(`⚡ Executing ${node.type}: ${node.data.label || node.type}`);

		// Process different node types
		switch (node.type) {
			case 'action':
				executeAction(node, context);
				break;
			case 'condition':
				executeCondition(node, context);
				return; // Condition handles its own branching
			case 'delay':
				executeDelay(node, context);
				return; // Delay handles timing
			default:
				// Continue to connected nodes immediately
				break;
		}

		// Find and execute connected nodes
		continueToConnectedNodes(nodeId, context);
	}

	function executeAction(node: any, context: any) {
		const { actionType, templateId, templateName } = node.data;

		if (['email', 'sms', 'dm'].includes(actionType)) {
			if (templateId) {
				console.log(`📧 Sending ${actionType} using template: ${templateName || templateId}`);
			} else {
				console.log(`⚠️ ${actionType} action missing template`);
			}
		} else if (actionType === 'mt5_check') {
			console.log('🔍 Performing MT5 verification check...');
			// Simulate MT5 check result
			context.mt5_verified = Math.random() > 0.5;
		}
	}

	function executeCondition(node: any, context: any) {
		const { field, operator, value } = node.data;
		console.log(`🔀 Evaluating condition: ${field} ${operator} ${value}`);

		// Simulate condition evaluation
		let result = false;
		if (field === 'mt5_verified') {
			result = context.mt5_verified === (value === 'true');
		} else {
			result = Math.random() > 0.5; // Random for simulation
		}

		console.log(`${result ? '✅' : '❌'} Condition result: ${result}`);

		// Continue to appropriate branch
		const connectedEdges = $edges.filter(e => e.source === node.id);
		const targetEdge = connectedEdges.find(e =>
			result ? e.sourceHandle === 'condition-yes' : e.sourceHandle === 'condition-no'
		);

		if (targetEdge) {
			const targetNode = $nodes.find(n => n.id === targetEdge.target);
			if (targetNode) {
				setTimeout(() => executeFromNode(targetNode.id, context), 300);
			}
		}
	}

	function executeDelay(node: any, context: any) {
		const { duration, unit } = node.data;
		const delayMs = duration * (unit === 'minutes' ? 60000 : unit === 'hours' ? 3600000 : 1000);
		console.log(`⏱️ Waiting ${duration} ${unit}... (simulated: ${Math.min(delayMs, 2000)}ms)`);

		setTimeout(() => {
			console.log(`⏰ Delay completed`);
			continueToConnectedNodes(node.id, context);
		}, Math.min(delayMs, 2000)); // Cap simulation delay at 2 seconds
	}

	function continueToConnectedNodes(nodeId: string, context: any) {
		const connectedEdges = $edges.filter(e => e.source === nodeId);

		connectedEdges.forEach(edge => {
			const targetNode = $nodes.find(n => n.id === edge.target);
			if (targetNode) {
				setTimeout(() => {
					executeFromNode(targetNode.id, context);
				}, 200);
			}
		});
	}

	// Save workflow
	function saveWorkflow() {
		const workflow = {
			...$workflowConfig,
			nodes: $nodes,
			edges: $edges,
			isValid: $isValidWorkflow
		};

		onSave(workflow);
	}

	// Keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		// Prevent shortcuts when typing in inputs
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) {
			return;
		}

		if (event.key === 'Delete' && $selectedNode) {
			deleteSelectedNode();
		} else if (event.key === 'Escape') {
			selectedNode.set(null);
		} else if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
			event.preventDefault();
			undo();
		} else if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
			event.preventDefault();
			redo();
		} else if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			saveWorkflow();
		}
	}

	// Auto-save on changes (debounced)
	let autoSaveTimeout: NodeJS.Timeout;
	$: {
		if ($nodes || $edges) {
			// Clear previous timeout
			if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
			// Set new timeout for auto-save
			autoSaveTimeout = setTimeout(autoSave, 1000);
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		// Load saved workflow on mount
		loadWorkflow();
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeydown);
		// Final auto-save on destroy
		autoSave();
	});

	// Expose functions for parent component
	export { createNode, updateNode, simulateWorkflow, saveWorkflow, deleteNode };
</script>

<div class="workflow-builder h-full bg-gray-50 dark:bg-black relative">
	<!-- Streamlined Node Creation Toolbar -->
	<div class="absolute top-6 left-1/2 -translate-x-1/2 z-10">
		<div class="flex gap-3 p-3 bg-white/95 dark:bg-black/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg">
			<button
				on:click={() => createNodeWithHistory('trigger', { x: 0, y: 0 })}
				class="px-4 py-2 text-sm font-medium text-white bg-green-500/90 hover:bg-green-500 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm flex items-center gap-2"
				title="Add a workflow trigger - starts your automation"
			>
				<div class="w-2 h-2 bg-white rounded-full"></div>
				Trigger
			</button>

			<button
				on:click={() => createNodeWithHistory('action', { x: 0, y: 0 })}
				disabled={!$hasTrigger}
				class="px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg shadow-sm {
					$hasTrigger
						? 'text-white bg-blue-500/90 hover:bg-blue-500 hover:scale-105'
						: 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed'
				} flex items-center gap-2"
				title={$hasTrigger ? "Add an action - sends emails, SMS, etc." : "Add a trigger first"}
			>
				<div class="w-2 h-2 bg-current rounded-full"></div>
				Action
			</button>

			<button
				on:click={() => createNodeWithHistory('condition', { x: 0, y: 0 })}
				disabled={!$hasTrigger}
				class="px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg shadow-sm {
					$hasTrigger
						? 'text-white bg-amber-500/90 hover:bg-amber-500 hover:scale-105'
						: 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed'
				} flex items-center gap-2"
				title={$hasTrigger ? "Add a condition - creates YES/NO branches" : "Add a trigger first"}
			>
				<div class="w-2 h-2 bg-current rounded-full"></div>
				Condition
			</button>

			<button
				on:click={() => createNodeWithHistory('delay', { x: 0, y: 0 })}
				disabled={!$hasTrigger}
				class="px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg shadow-sm {
					$hasTrigger
						? 'text-white bg-orange-500/90 hover:bg-orange-500 hover:scale-105'
						: 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed'
				} flex items-center gap-2"
				title={$hasTrigger ? "Add a delay - waits before continuing" : "Add a trigger first"}
			>
				<div class="w-2 h-2 bg-current rounded-full"></div>
				Delay
			</button>
		</div>
	</div>

	<!-- Workflow Tools -->
	<div class="absolute top-6 right-6 z-10 flex gap-2">
		<button
			on:click={arrangeVertically}
			disabled={$nodes.length < 2}
			class="p-2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
			title="Arrange nodes vertically"
		>
			📐
		</button>
		<button
			on:click={connectAllVertically}
			disabled={$nodes.length < 2}
			class="p-2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
			title="Connect nodes vertically"
		>
			🔗
		</button>
	</div>

	<!-- Minimal Status Bar -->
	<div class="absolute bottom-6 left-6 z-10">
		<div class="flex items-center gap-4 px-4 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-sm">
			<div class="flex items-center gap-2">
				<div class="w-2 h-2 rounded-full {$isValidWorkflow ? 'bg-green-400' : $hasTrigger ? 'bg-amber-400' : 'bg-gray-400'} animate-pulse"></div>
				<span class="text-sm text-gray-600 dark:text-gray-300">
					{$nodes.length} nodes • {$edges.length} connections
				</span>
			</div>

			{#if $nodes.length === 0}
				<div class="text-xs text-gray-500 dark:text-gray-400">
					Click "🎯 Trigger" to start building
				</div>
			{:else}
				<div class="text-xs font-medium {$isValidWorkflow ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}">
					{$isValidWorkflow ? '✓ Ready' : $hasTrigger ? 'Building...' : 'Needs Trigger'}
				</div>
			{/if}
		</div>
	</div>

	<!-- Simplified Action Menu -->
	<div class="absolute bottom-6 right-6 z-10">
		<div class="flex gap-2">
			<button
				on:click={previewFlowExecution}
				disabled={$nodes.length === 0}
				class="p-2 bg-blue-500/90 hover:bg-blue-500 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
				title="Preview workflow execution"
			>
				🎬
			</button>
			<button
				on:click={saveWorkflow}
				disabled={!$isValidWorkflow}
				class="px-3 py-2 text-sm font-medium text-white bg-green-500/90 hover:bg-green-500 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
				title="Save workflow"
			>
				💾 Save
			</button>
		</div>
	</div>

	<!-- Svelte Flow -->
	<SvelteFlow
		{nodes}
		{edges}
		{nodeTypes}
		connectionMode={ConnectionMode.Loose}
		on:nodeclick={onNodeClick}
		on:connect={onConnect}
		on:nodeschange={(e) => console.log('Nodes changed:', e)}
		on:edgeschange={(e) => console.log('Edges changed:', e)}
		snapToGrid={true}
		snapGrid={[20, 20]}
		fitView={true}
		fitViewOptions={{
			padding: 0.3,
			minZoom: 0.5,
			maxZoom: 1.5
		}}
		defaultEdgeOptions={{
			animated: false,
			type: 'step',
			style: 'stroke-width: 2px; stroke: rgb(156, 163, 175);'
		}}
		class="workflow-canvas"
	>
		<Background color="#374151" gap={20} size={1} />
		<Controls showInteractive={false} position="top-left" />
	</SvelteFlow>
</div>

<!-- Compact Node Settings Modal -->
{#if $selectedNode}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" on:click={() => selectedNode.set(null)}>
		<div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-96 max-w-[90vw] max-h-[80vh] overflow-y-auto" on:click|stopPropagation>
			<!-- Header -->
			<div class="flex justify-between items-center mb-4">
				<h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
					{$selectedNode.type === 'trigger' ? '🎯 Trigger Settings' :
					 $selectedNode.type === 'action' ? '⚡ Action Settings' :
					 $selectedNode.type === 'condition' ? '🔀 Condition Settings' :
					 '⏰ Delay Settings'}
				</h3>
				<button
					on:click={() => selectedNode.set(null)}
					class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
				>
					✕
				</button>
			</div>

			<!-- Quick Settings Form -->
			<div class="space-y-4">
				{#if $selectedNode.type === 'action'}
					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Action Type</label>
						<select
							bind:value={$selectedNode.data.actionType}
							on:change={() => updateNode($selectedNode.id, { actionType: $selectedNode.data.actionType })}
							class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
						>
							<option value="email">Send Email</option>
							<option value="sms">Send SMS</option>
							<option value="dm">Send DM</option>
						</select>
					</div>
				{:else if $selectedNode.type === 'condition'}
					<div class="grid grid-cols-3 gap-3">
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Field</label>
							<select
								bind:value={$selectedNode.data.field}
								on:change={() => updateNode($selectedNode.id, { field: $selectedNode.data.field })}
								class="w-full px-2 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
							>
								<option value="email_opened">Email Opened</option>
								<option value="link_clicked">Link Clicked</option>
								<option value="mt5_verified">MT5 Verified</option>
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Operator</label>
							<select
								bind:value={$selectedNode.data.operator}
								on:change={() => updateNode($selectedNode.id, { operator: $selectedNode.data.operator })}
								class="w-full px-2 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
							>
								<option value="equals">Equals</option>
								<option value="not_equals">Not Equals</option>
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Value</label>
							<input
								type="text"
								bind:value={$selectedNode.data.value}
								on:input={() => updateNode($selectedNode.id, { value: $selectedNode.data.value })}
								class="w-full px-2 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
								placeholder="true"
							/>
						</div>
					</div>
				{:else if $selectedNode.type === 'delay'}
					<div class="flex gap-3">
						<div class="flex-1">
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
							<input
								type="number"
								bind:value={$selectedNode.data.duration}
								on:input={() => updateNode($selectedNode.id, { duration: $selectedNode.data.duration })}
								class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
								min="1"
							/>
						</div>
						<div class="flex-1">
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
							<select
								bind:value={$selectedNode.data.unit}
								on:change={() => updateNode($selectedNode.id, { unit: $selectedNode.data.unit })}
								class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
							>
								<option value="minutes">Minutes</option>
								<option value="hours">Hours</option>
								<option value="days">Days</option>
							</select>
						</div>
					</div>
				{/if}

				<!-- Action Buttons -->
				<div class="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
					<button
						on:click={saveNodeChanges}
						class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
					>
						✓ Save
					</button>
					<button
						on:click={deleteSelectedNode}
						class="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
					>
						🗑 Delete
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Notification System -->
{#if $notifications.length > 0}
	<div class="fixed top-4 right-4 z-50 space-y-2">
		{#each $notifications as notification (notification.id)}
			<div
				class="px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border transition-all duration-300 {
					notification.type === 'success'
						? 'bg-green-500/90 border-green-400/30 text-white'
						: notification.type === 'info'
						? 'bg-blue-500/90 border-blue-400/30 text-white'
						: 'bg-red-500/90 border-red-400/30 text-white'
				}"
			>
				{notification.message}
			</div>
		{/each}
	</div>
{/if}

<style>
	.workflow-builder {
		font-family: 'Inter', sans-serif;
	}

	:global(.workflow-canvas .svelte-flow__node) {
		font-size: 12px;
	}

	/* GoHighLevel-style vertical connection lines */
	:global(.workflow-canvas .svelte-flow__edge) {
		stroke-width: 3px;
		stroke: rgb(59, 130, 246);
		filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1));
		transition: all 0.2s ease;
	}

	:global(.workflow-canvas .svelte-flow__edge:hover) {
		stroke-width: 4px;
		filter: drop-shadow(0 2px 6px rgba(59, 130, 246, 0.3));
	}

	:global(.workflow-canvas .svelte-flow__edge.selected) {
		stroke-width: 4px;
		stroke: rgb(34, 197, 94);
		filter: drop-shadow(0 2px 6px rgba(34, 197, 94, 0.4));
	}

	/* Step edges for vertical flow */
	:global(.workflow-canvas .svelte-flow__edge.svelte-flow__edge-step) {
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	/* Auto-generated vertical connections */
	:global(.workflow-canvas .svelte-flow__edge[data-id*="auto-"]) {
		stroke: rgb(34, 197, 94) !important;
		stroke-width: 2.5px;
		filter: drop-shadow(0 2px 4px rgba(34, 197, 94, 0.3));
	}

	/* Manual vertical connections */
	:global(.workflow-canvas .svelte-flow__edge[data-id*="vertical-"]) {
		stroke: rgb(59, 130, 246) !important;
		stroke-width: 2.5px;
		filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3));
	}

	:global(.workflow-canvas .svelte-flow__edge-path) {
		stroke-linecap: round;
	}

	/* Connection line colors by source type */
	:global(.workflow-canvas .svelte-flow__edge[data-source-type="trigger"]) {
		stroke: rgb(34, 197, 94);
	}

	:global(.workflow-canvas .svelte-flow__edge[data-source-type="action"]) {
		stroke: rgb(59, 130, 246);
	}

	:global(.workflow-canvas .svelte-flow__edge[data-source-type="condition"]) {
		stroke: rgb(245, 158, 11);
	}

	:global(.workflow-canvas .svelte-flow__edge[data-source-type="delay"]) {
		stroke: rgb(249, 115, 22);
	}

	/* Condition branch colors - GoHighLevel style */
	:global(.workflow-canvas .svelte-flow__edge[data-source-handle="condition-yes"]) {
		stroke: rgb(34, 197, 94) !important;
		stroke-width: 3px;
		stroke-linecap: round;
	}

	:global(.workflow-canvas .svelte-flow__edge[data-source-handle="condition-no"]) {
		stroke: rgb(239, 68, 68) !important;
		stroke-width: 3px;
		stroke-linecap: round;
	}

	/* Force step connections to be clean and vertical */
	:global(.workflow-canvas .svelte-flow__edge-step .svelte-flow__edge-path) {
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	@keyframes flow {
		to {
			stroke-dashoffset: -12;
		}
	}

	/* Background grid enhancement */
	:global(.workflow-canvas .react-flow__background) {
		background-color: transparent;
	}

	/* Connection drop zones */
	:global(.workflow-canvas .svelte-flow__handle) {
		transition: all 0.2s ease;
	}

	:global(.workflow-canvas .svelte-flow__handle.connecting) {
		transform: scale(1.5);
		filter: drop-shadow(0 0 8px currentColor);
	}
</style>