document.addEventListener('DOMContentLoaded', () => {

    // 1. Theme and Flow Master Toggle Logic
    const body = document.body;
    const flowSn = document.getElementById('flow-servicenow');
    const flowCl = document.getElementById('flow-claude');

    window.switchTheme = function(theme) {
        body.setAttribute('data-theme', theme);
        
        // Update all sidebar toggle buttons dynamically across both active/inactive sidebars
        document.querySelectorAll('.side-btn').forEach(btn => {
            if (theme === 'servicenow') {
                if (btn.getAttribute('onclick').includes('servicenow')) btn.classList.add('active');
                if (btn.getAttribute('onclick').includes('claude')) btn.classList.remove('active');
            } else {
                if (btn.getAttribute('onclick').includes('claude')) btn.classList.add('active');
                if (btn.getAttribute('onclick').includes('servicenow')) btn.classList.remove('active');
            }
        });
        
        if (theme === 'servicenow') {
            flowSn.classList.add('active');
            flowCl.classList.remove('active');
            // Retrigger entrance animation for the active step in SN
            if(window.snCtrl) window.snCtrl.retriggerCurrent();
        } else {
            flowCl.classList.add('active');
            flowSn.classList.remove('active');
            // Retrigger entrance animation for the active step in Claude
            if(window.clCtrl) window.clCtrl.retriggerCurrent();
        }
    };

    // 2. Modular Wizard Controller
    class WizardController {
        constructor(flowId, sidebarId, btnPrevId, btnNextId, counterId) {
            this.container = document.getElementById(flowId);
            // Ignore elements not part of this specific flow's container
            this.stepsElements = Array.from(this.container.querySelectorAll('.wizard-step'));
            this.totalSteps = this.stepsElements.length;
            this.currentStep = 1;
            
            this.btnNext = document.getElementById(btnNextId);
            this.btnPrev = document.getElementById(btnPrevId);
            this.counter = document.getElementById(counterId);
            this.sidebarList = document.getElementById(sidebarId);
            this.controlsArea = this.container.querySelector('.wizard-controls');

            this.initSidebar();
            this.updateUI();
        }

        initSidebar() {
            this.stepsElements.forEach((stepEl, idx) => {
                const stepNum = idx + 1;
                const title = stepEl.getAttribute('data-title');
                
                const li = document.createElement('li');
                li.className = `step-item ${stepNum === 1 ? 'active' : ''}`;
                li.id = `${this.sidebarList.id}-nav-${stepNum}`;
                li.onclick = () => this.goToStep(stepNum);

                li.innerHTML = `
                    <div class="step-indicator" id="${this.sidebarList.id}-indicator-${stepNum}">${stepNum}</div>
                    <div class="step-info">
                        <div class="step-name">${title}</div>
                    </div>
                `;
                this.sidebarList.appendChild(li);
            });
        }

        updateUI() {
            // Update Main Cards
            this.stepsElements.forEach((el, idx) => {
                const num = idx + 1;
                el.classList.remove('active', 'exit-left', 'play-animation');
                
                if (num < this.currentStep) {
                    el.classList.add('exit-left');
                } else if (num === this.currentStep) {
                    el.classList.add('active');
                    void el.offsetWidth; // Reflow
                    el.classList.add('play-animation');
                }
            });

            // Update Sidebar
            for (let i = 1; i <= this.totalSteps; i++) {
                const li = document.getElementById(`${this.sidebarList.id}-nav-${i}`);
                const indicator = document.getElementById(`${this.sidebarList.id}-indicator-${i}`);
                
                if (!li) continue;

                li.classList.remove('active', 'completed');
                if (i < this.currentStep) {
                    li.classList.add('completed');
                    indicator.innerHTML = '<i class="fa-solid fa-check"></i>';
                } else if (i === this.currentStep) {
                    li.classList.add('active');
                    indicator.innerHTML = i;
                } else {
                    indicator.innerHTML = i;
                }
            }

            // Update Controls Footer
            if(this.counter) {
                this.counter.textContent = `Step ${this.currentStep} of ${this.totalSteps}`;
            }
            this.btnPrev.disabled = this.currentStep === 1;
            
            // Note: The UI logic customizes finish buttons if needed. SN has 7 steps, Claude has 5.
            if (this.currentStep === this.totalSteps) {
                // If the flow specifically ends with a 'celebration' step (like SN), we hide controls.
                // We'll hide controls on SN step 6, but for Claude Step 4 maybe keep it or label "Finish".
                if (this.container.id === 'flow-servicenow') {
                    this.controlsArea.style.display = 'none';
                } else {
                    this.btnNext.style.display = 'none'; // Reached end of Claude flow
                }
            } else {
                this.controlsArea.style.display = 'flex';
                this.btnNext.style.display = 'flex';
                this.btnNext.innerHTML = this.currentStep === this.totalSteps - 1 
                    ? 'Finish <i class="fa-solid fa-flag-checkered"></i>' 
                    : 'Next <i class="fa-solid fa-arrow-right"></i>';
            }
        }

        retriggerCurrent() {
            const el = this.stepsElements[this.currentStep - 1];
            if (el) {
                el.classList.remove('play-animation');
                void el.offsetWidth;
                el.classList.add('play-animation');
            }
        }

        goToStep(num) {
            if (num >= 1 && num <= this.totalSteps) {
                this.currentStep = num;
                this.updateUI();
            }
        }

        next() {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.updateUI();
            }
        }

        prev() {
            if (this.currentStep > 1) {
                this.currentStep--;
                this.updateUI();
            }
        }
    }

    // Initialize both Wizards globally so onclick buttons can access them
    window.snCtrl = new WizardController('flow-servicenow', 'sidebar-servicenow', 'btn-prev-sn', 'btn-next-sn', 'counter-sn');
    window.clCtrl = new WizardController('flow-claude', 'sidebar-claude', 'btn-prev-cl', 'btn-next-cl', 'counter-cl');

    // 3. Tab System (For Basic/OAuth and Mac/Windows)
    window.switchTab = function(tabId) {
        const tabEl = document.getElementById(tabId);
        if(!tabEl) return;
        const group = tabEl.closest('.command-group');
        if(!group) return;
        
        group.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        group.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        tabEl.classList.add('active');
        const clickedBtn = Array.from(group.querySelectorAll('.tab-btn')).find(btn => btn.getAttribute('onclick').includes(tabId));
        if (clickedBtn) clickedBtn.classList.add('active');
    };

    // 4. Global Copy to Clipboard Handler
    window.copyCode = function(btn) {
        // Can be attached to .code-block or .prompt-block
        const pre = btn.closest('.code-block, .prompt-block').querySelector('pre');
        const text = pre.textContent;
        
        const successState = () => {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
                btn.classList.remove('copied');
            }, 2000);
        };

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(successState);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            successState();
        }
    };

    // Bind all copy buttons initially
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            window.copyCode(this);
        });
    });



    // 6. Download Prompt as .txt
    window.downloadPrompt = function(blockId, filename) {
        const block = document.getElementById(blockId);
        if (!block) return;
        const pre = block.querySelector('pre');
        if (!pre) return;

        const text = pre.textContent;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'prompt.txt';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };



});
