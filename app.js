/* ============================================================
   NC Network Error Detection — Calculator
   CRC, Checksum, Hamming Code with step-by-step solutions
   ============================================================ */

(function () {
  'use strict';

  // ===== HELPERS =====
  function isBinary(s) { return /^[01]+$/.test(s); }

  function xorBits(a, b) {
    return a.split('').map(function (c, i) { return c === b[i] ? '0' : '1'; }).join('');
  }

  function padLeft(s, len) {
    while (s.length < len) s = '0' + s;
    return s;
  }

  function addBinary(a, b) {
    var maxLen = Math.max(a.length, b.length);
    a = padLeft(a, maxLen);
    b = padLeft(b, maxLen);
    var carry = 0, result = '';
    for (var i = maxLen - 1; i >= 0; i--) {
      var sum = parseInt(a[i]) + parseInt(b[i]) + carry;
      result = (sum % 2) + result;
      carry = Math.floor(sum / 2);
    }
    if (carry) result = '1' + result;
    return result;
  }

  function onesComplement(s) {
    return s.split('').map(function (c) { return c === '0' ? '1' : '0'; }).join('');
  }

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ===== CRC CALCULATION =====
  function calculateCRC(data, poly) {
    var degPoly = poly.length - 1;
    var augmented = data + '0'.repeat(degPoly);
    var steps = [];
    var current = augmented;

    steps.push({
      type: 'info',
      html: '<p><strong>CRC Division:</strong> Append ' + degPoly + ' zero(s) to data, then perform binary division using XOR with the generator polynomial.</p>'
    });
    steps.push({
      type: 'info',
      html: '<p>Data: <code>' + data + '</code> → Augmented: <code>' + augmented + '</code></p><p>Generator: <code>' + poly + '</code> (degree ' + degPoly + ')</p>'
    });

    steps.push({ type: 'heading', text: 'XOR Division Steps' });

    var xorSteps = [];
    var pos = 0;

    // Build register
    var reg = augmented.split('');

    // Perform division
    for (var i = 0; i <= augmented.length - poly.length; i++) {
      if (reg[i] === '0') {
        xorSteps.push({
          position: i,
          dividend: reg.slice(i, i + poly.length).join(''),
          divisor: null,
          result: null,
          skipped: true
        });
        continue;
      }

      var chunk = reg.slice(i, i + poly.length).join('');
      var xorResult = xorBits(chunk, poly);

      xorSteps.push({
        position: i,
        dividend: chunk,
        divisor: poly,
        result: xorResult,
        skipped: false
      });

      // Write back
      for (var j = 0; j < poly.length; j++) {
        reg[i + j] = xorResult[j];
      }
    }

    // Build step-by-step HTML
    for (var s = 0; s < xorSteps.length; s++) {
      var step = xorSteps[s];
      if (step.skipped) {
        steps.push({
          type: 'step',
          substeps: ['Step ' + (s + 1) + ' (position ' + step.position + '): Leading bit is 0, skip XOR']
        });
      } else {
        steps.push({
          type: 'step',
          substeps: [
            'Step ' + (s + 1) + ' (position ' + step.position + '):',
            '  ' + step.dividend + '  ← current bits',
            '⊕ ' + step.divisor + '  ← generator',
            '  ' + Array(step.result.length + 1).join('─'),
            '  <strong>' + step.result + '</strong>  ← remainder'
          ]
        });
      }
    }

    var remainder = reg.slice(reg.length - degPoly).join('');
    var codeword = data + remainder;

    steps.push({ type: 'heading', text: 'Result' });
    steps.push({
      type: 'step',
      substeps: [
        'Remainder (CRC): <strong>' + remainder + '</strong>',
        'Transmitted codeword: <strong>' + codeword + '</strong>'
      ]
    });

    return {
      method: 'CRC',
      data: data,
      poly: poly,
      remainder: remainder,
      codeword: codeword,
      steps: steps,
      xorSteps: xorSteps
    };
  }

  // CRC verification
  function verifyCRC(received, poly) {
    var degPoly = poly.length - 1;
    var reg = received.split('');
    var steps = [];
    var xorSteps = [];

    steps.push({
      type: 'info',
      html: '<p><strong>CRC Verification:</strong> Divide received codeword by generator polynomial. If remainder is all zeros, no error detected.</p>'
    });

    for (var i = 0; i <= received.length - poly.length; i++) {
      if (reg[i] === '0') continue;

      var chunk = reg.slice(i, i + poly.length).join('');
      var xorResult = xorBits(chunk, poly);

      xorSteps.push({
        position: i,
        dividend: chunk,
        divisor: poly,
        result: xorResult
      });

      for (var j = 0; j < poly.length; j++) {
        reg[i + j] = xorResult[j];
      }
    }

    var remainder = reg.slice(reg.length - degPoly).join('');
    var isValid = /^0+$/.test(remainder);

    return { remainder: remainder, isValid: isValid, steps: steps, xorSteps: xorSteps };
  }

  // ===== CHECKSUM CALCULATION =====
  function calculateChecksum(data, blockSize) {
    var steps = [];

    // Pad data to block size
    var paddedData = data;
    if (data.length % blockSize !== 0) {
      var padLen = blockSize - (data.length % blockSize);
      paddedData = '0'.repeat(padLen) + data;
      steps.push({
        type: 'info',
        html: '<p>Data padded with ' + padLen + ' leading zero(s) to fit ' + blockSize + '-bit blocks: <code>' + paddedData + '</code></p>'
      });
    }

    var blocks = [];
    for (var i = 0; i < paddedData.length; i += blockSize) {
      blocks.push(paddedData.substring(i, i + blockSize));
    }

    steps.push({
      type: 'info',
      html: '<p><strong>Checksum Calculation:</strong> Split data into ' + blockSize + '-bit blocks, add them using binary addition with wraparound carry, then take the 1\'s complement.</p>'
    });
    steps.push({ type: 'heading', text: 'Block Addition' });

    var addSteps = [];
    var sum = blocks[0];
    addSteps.push({ label: 'Block 1', bits: blocks[0] });

    for (var i = 1; i < blocks.length; i++) {
      var rawSum = addBinary(sum, blocks[i]);

      addSteps.push({ label: 'Block ' + (i + 1), bits: blocks[i] });

      // Wraparound carry
      if (rawSum.length > blockSize) {
        var overflow = rawSum.substring(0, rawSum.length - blockSize);
        var lower = rawSum.substring(rawSum.length - blockSize);
        var wrapped = addBinary(lower, overflow);
        if (wrapped.length > blockSize) {
          overflow = wrapped.substring(0, wrapped.length - blockSize);
          wrapped = addBinary(wrapped.substring(wrapped.length - blockSize), overflow);
        }
        wrapped = padLeft(wrapped, blockSize);

        steps.push({
          type: 'step',
          substeps: [
            'Add Block ' + i + ' + Block ' + (i + 1) + ':',
            '  ' + sum + ' + ' + blocks[i] + ' = ' + rawSum,
            '  Wraparound carry: ' + lower + ' + ' + overflow + ' = <strong>' + wrapped + '</strong>'
          ]
        });
        sum = wrapped;
      } else {
        sum = padLeft(rawSum, blockSize);
        steps.push({
          type: 'step',
          substeps: [
            'Add: ' + (i === 1 ? blocks[0] : 'running sum') + ' + ' + blocks[i] + ' = <strong>' + sum + '</strong>'
          ]
        });
      }
    }

    var checksum = onesComplement(sum);

    steps.push({ type: 'heading', text: 'Result' });
    steps.push({
      type: 'step',
      substeps: [
        'Sum: ' + sum,
        '1\'s complement (checksum): <strong>' + checksum + '</strong>',
        'Transmitted: <strong>' + paddedData + checksum + '</strong>'
      ]
    });

    return {
      method: 'Checksum',
      data: data,
      paddedData: paddedData,
      blockSize: blockSize,
      blocks: blocks,
      sum: sum,
      checksum: checksum,
      transmitted: paddedData + checksum,
      steps: steps,
      addSteps: addSteps
    };
  }

  function verifyChecksum(received, blockSize) {
    var blocks = [];
    for (var i = 0; i < received.length; i += blockSize) {
      blocks.push(received.substring(i, i + blockSize));
    }

    var sum = blocks[0];
    for (var i = 1; i < blocks.length; i++) {
      var rawSum = addBinary(sum, blocks[i]);
      if (rawSum.length > blockSize) {
        var overflow = rawSum.substring(0, rawSum.length - blockSize);
        var lower = rawSum.substring(rawSum.length - blockSize);
        sum = addBinary(lower, overflow);
        if (sum.length > blockSize) {
          sum = addBinary(sum.substring(sum.length - blockSize), sum.substring(0, sum.length - blockSize));
        }
        sum = padLeft(sum, blockSize);
      } else {
        sum = padLeft(rawSum, blockSize);
      }
    }

    var isValid = /^1+$/.test(sum);
    return { sum: sum, isValid: isValid };
  }

  // ===== HAMMING CODE =====
  function hammingEncode(data) {
    var steps = [];
    var dataBits = data.split('').map(Number);
    var m = dataBits.length;

    // Calculate number of parity bits needed
    var r = 0;
    while (Math.pow(2, r) < m + r + 1) r++;

    var totalBits = m + r;
    var encoded = new Array(totalBits + 1); // 1-indexed
    encoded[0] = null; // placeholder

    steps.push({
      type: 'info',
      html: '<p><strong>Hamming Code Encoding:</strong> ' + m + ' data bits require ' + r + ' parity bits (2<sup>' + r + '</sup> ≥ ' + (m + r + 1) + '). Total bits: ' + totalBits + '.</p>'
    });

    // Mark parity positions (powers of 2)
    var parityPositions = [];
    for (var i = 0; i < r; i++) parityPositions.push(Math.pow(2, i));

    // Place data bits
    var dataIdx = 0;
    var positionMap = [];
    for (var pos = 1; pos <= totalBits; pos++) {
      if (parityPositions.indexOf(pos) !== -1) {
        encoded[pos] = 0; // parity bit placeholder
        positionMap.push({ pos: pos, type: 'parity', parityIndex: parityPositions.indexOf(pos) });
      } else {
        encoded[pos] = dataBits[dataIdx];
        positionMap.push({ pos: pos, type: 'data', dataIndex: dataIdx });
        dataIdx++;
      }
    }

    steps.push({ type: 'heading', text: 'Bit Placement' });
    var placementLines = ['Parity bit positions (powers of 2): ' + parityPositions.join(', ')];
    var placementRow = '';
    for (var pos = 1; pos <= totalBits; pos++) {
      placementRow += 'P' + pos + ':' + (parityPositions.indexOf(pos) !== -1 ? '?' : encoded[pos]) + ' ';
    }
    placementLines.push(placementRow.trim());
    steps.push({ type: 'step', substeps: placementLines });

    // Calculate each parity bit
    steps.push({ type: 'heading', text: 'Parity Bit Calculation' });

    for (var pi = 0; pi < r; pi++) {
      var parityPos = parityPositions[pi];
      var coveredPositions = [];
      var coveredValues = [];

      for (var pos = 1; pos <= totalBits; pos++) {
        if (pos === parityPos) continue;
        if ((pos & parityPos) !== 0) {
          coveredPositions.push(pos);
          coveredValues.push(encoded[pos]);
        }
      }

      var parityValue = 0;
      for (var v = 0; v < coveredValues.length; v++) parityValue ^= coveredValues[v];
      encoded[parityPos] = parityValue;

      steps.push({
        type: 'step',
        substeps: [
          'P' + parityPos + ' (position ' + parityPos + ') covers positions: ' + coveredPositions.join(', '),
          'Values: ' + coveredValues.join(' ⊕ ') + ' = <strong>' + parityValue + '</strong>'
        ]
      });
    }

    var encodedStr = '';
    for (var pos = 1; pos <= totalBits; pos++) encodedStr += encoded[pos];

    steps.push({ type: 'heading', text: 'Result' });
    steps.push({
      type: 'step',
      substeps: ['Encoded Hamming code: <strong>' + encodedStr + '</strong>']
    });

    return {
      method: 'Hamming',
      mode: 'encode',
      data: data,
      encoded: encodedStr,
      encodedArray: encoded,
      parityPositions: parityPositions,
      totalBits: totalBits,
      r: r,
      steps: steps,
      positionMap: positionMap
    };
  }

  function hammingDecode(received) {
    var steps = [];
    var bits = received.split('').map(Number);
    var n = bits.length;

    // Determine r
    var r = 0;
    while (Math.pow(2, r) <= n) r++;

    var parityPositions = [];
    for (var i = 0; i < r; i++) parityPositions.push(Math.pow(2, i));

    // Build 1-indexed array
    var encoded = [null];
    for (var i = 0; i < n; i++) encoded.push(bits[i]);

    steps.push({
      type: 'info',
      html: '<p><strong>Hamming Code Decoding:</strong> ' + n + ' bits received. Checking ' + r + ' parity bits to detect and correct errors.</p>'
    });

    steps.push({ type: 'heading', text: 'Syndrome Calculation' });

    var syndrome = 0;
    var syndromeDetails = [];

    for (var pi = 0; pi < r; pi++) {
      var parityPos = parityPositions[pi];
      var xorVal = 0;
      var coveredPositions = [];

      for (var pos = 1; pos <= n; pos++) {
        if ((pos & parityPos) !== 0) {
          coveredPositions.push(pos);
          xorVal ^= encoded[pos];
        }
      }

      var checkBit = xorVal;
      syndromeDetails.push({
        parityPos: parityPos,
        covered: coveredPositions,
        checkBit: checkBit
      });

      if (checkBit !== 0) {
        syndrome += parityPos;
      }

      steps.push({
        type: 'step',
        substeps: [
          'Check P' + parityPos + ': XOR of positions ' + coveredPositions.join(', '),
          'Values: ' + coveredPositions.map(function (p) { return encoded[p]; }).join(' ⊕ ') + ' = <strong>' + checkBit + '</strong>' + (checkBit !== 0 ? ' ✗ (error)' : ' ✓')
        ]
      });
    }

    steps.push({ type: 'heading', text: 'Error Detection' });

    var errorPos = syndrome;
    var corrected = null;
    var correctedStr = received;

    if (errorPos === 0) {
      steps.push({
        type: 'step',
        substeps: ['Syndrome = <strong>0</strong>: No error detected! ✓']
      });
    } else {
      steps.push({
        type: 'step',
        substeps: [
          'Syndrome = ' + syndromeDetails.filter(function (s) { return s.checkBit !== 0; }).map(function (s) { return s.parityPos; }).join(' + ') + ' = <strong>' + errorPos + '</strong>',
          'Error detected at position <strong>' + errorPos + '</strong>!',
          'Bit at position ' + errorPos + ': ' + encoded[errorPos] + ' → <strong>' + (1 - encoded[errorPos]) + '</strong> (corrected)'
        ]
      });

      // Correct the error
      corrected = encoded.slice();
      corrected[errorPos] = 1 - corrected[errorPos];
      correctedStr = '';
      for (var pos = 1; pos <= n; pos++) correctedStr += corrected[pos];
    }

    // Extract data bits
    var dataBits = '';
    for (var pos = 1; pos <= n; pos++) {
      if (parityPositions.indexOf(pos) === -1) {
        dataBits += (corrected ? corrected[pos] : encoded[pos]);
      }
    }

    steps.push({ type: 'heading', text: 'Result' });
    steps.push({
      type: 'step',
      substeps: [
        (errorPos > 0 ? 'Corrected code: <strong>' + correctedStr + '</strong>' : 'Received code: <strong>' + received + '</strong>'),
        'Extracted data bits: <strong>' + dataBits + '</strong>'
      ]
    });

    return {
      method: 'Hamming',
      mode: 'decode',
      received: received,
      encoded: encoded,
      syndrome: syndrome,
      errorPos: errorPos,
      corrected: corrected,
      correctedStr: correctedStr,
      dataBits: dataBits,
      parityPositions: parityPositions,
      totalBits: n,
      r: r,
      steps: steps,
      syndromeDetails: syndromeDetails
    };
  }

  // ===== RENDERING =====
  function renderBinaryDisplay(bits, options) {
    options = options || {};
    var html = '<div class="binary-display">';
    for (var i = 0; i < bits.length; i++) {
      var cls = 'bit';
      var label = '';

      if (options.classes && options.classes[i]) cls += ' ' + options.classes[i];
      if (options.labels && options.labels[i]) label = options.labels[i];

      html += '<div class="' + cls + '">';
      if (label) html += '<span class="bit-label">' + label + '</span>';
      html += bits[i];
      html += '</div>';

      if (options.separators && options.separators[i]) {
        html += '<div class="separator">|</div>';
      }
    }
    html += '</div>';
    return html;
  }

  function renderStepsHTML(steps) {
    var html = '';
    for (var s = 0; s < steps.length; s++) {
      var step = steps[s];
      if (step.type === 'heading') html += '<h3 class="step-heading">' + step.text + '</h3>';
      else if (step.type === 'subheading') html += '<h4 class="step-subheading">' + step.text + '</h4>';
      else if (step.type === 'info') html += step.html;
      else if (step.type === 'step') {
        html += '<div class="step-block">';
        for (var ss = 0; ss < step.substeps.length; ss++) html += '<div class="step-line">' + step.substeps[ss] + '</div>';
        html += '</div>';
      }
    }
    return html;
  }

  function renderCRCResult(result) {
    var html = '<div class="result-panel">';
    html += '<h2 class="result-title">CRC (Cyclic Redundancy Check)</h2>';

    // Binary display: data bits + CRC bits
    var bits = result.codeword.split('');
    var classes = {};
    var labels = {};
    for (var i = 0; i < result.data.length; i++) {
      classes[i] = 'data-bit';
      labels[i] = 'd' + (i + 1);
    }
    for (var i = result.data.length; i < bits.length; i++) {
      classes[i] = 'crc-bit';
      labels[i] = 'r' + (i - result.data.length + 1);
    }
    var separators = {};
    separators[result.data.length - 1] = true;

    html += '<h3>Transmitted Codeword</h3>';
    html += renderBinaryDisplay(bits, { classes: classes, labels: labels, separators: separators });

    html += '<div class="result-info"><strong>Data:</strong> ' + result.data + ' | <strong>CRC:</strong> ' + result.remainder + ' | <strong>Polynomial:</strong> ' + result.poly + '</div>';

    // XOR division visualization
    html += '<details class="steps-details" open><summary>Step-by-Step XOR Division</summary>';
    html += '<div class="steps-content">' + renderStepsHTML(result.steps) + '</div>';
    html += '</details>';

    // Error injection
    html += renderErrorInjection(result);

    // Share
    html += renderShareSection(result);

    html += '</div>';
    return html;
  }

  function renderChecksumResult(result) {
    var html = '<div class="result-panel">';
    html += '<h2 class="result-title">Checksum</h2>';

    // Binary display
    var bits = result.transmitted.split('');
    var classes = {};
    var labels = {};
    var separators = {};
    for (var i = 0; i < result.paddedData.length; i++) {
      classes[i] = 'data-bit';
      // Mark block boundaries
      if (i > 0 && i % result.blockSize === 0) {
        separators[i - 1] = true;
      }
    }
    separators[result.paddedData.length - 1] = true;
    for (var i = result.paddedData.length; i < bits.length; i++) {
      classes[i] = 'check-bit';
      labels[i] = 'c' + (i - result.paddedData.length + 1);
    }

    html += '<h3>Transmitted Data with Checksum</h3>';
    html += renderBinaryDisplay(bits, { classes: classes, labels: labels, separators: separators });

    html += '<div class="result-info"><strong>Block size:</strong> ' + result.blockSize + ' bits | <strong>Blocks:</strong> ' + result.blocks.length + ' | <strong>Sum:</strong> ' + result.sum + ' | <strong>Checksum:</strong> ' + result.checksum + '</div>';

    // Checksum addition visualization
    html += '<details class="steps-details" open><summary>Step-by-Step Addition</summary>';
    html += '<div class="steps-content">';

    html += '<div class="checksum-table">';
    for (var i = 0; i < result.blocks.length; i++) {
      html += '<div class="checksum-row"><span class="row-label">Block ' + (i + 1) + ':</span><span class="row-bits">' + result.blocks[i] + '</span></div>';
    }
    html += '<div class="checksum-row sum-row"><span class="row-label">Sum:</span><span class="row-bits">' + result.sum + '</span></div>';
    html += '<div class="checksum-row complement-row"><span class="row-label">Checksum:</span><span class="row-bits">' + result.checksum + '</span></div>';
    html += '</div>';

    html += renderStepsHTML(result.steps);
    html += '</div></details>';

    // Error injection
    html += renderErrorInjection(result);

    // Share
    html += renderShareSection(result);

    html += '</div>';
    return html;
  }

  function renderHammingResult(result) {
    var html = '<div class="result-panel">';
    html += '<h2 class="result-title">Hamming Code — ' + (result.mode === 'encode' ? 'Encoding' : 'Decoding') + '</h2>';

    if (result.mode === 'encode') {
      var bits = result.encoded.split('');
      var classes = {};
      var labels = {};
      for (var pos = 1; pos <= result.totalBits; pos++) {
        var idx = pos - 1;
        if (result.parityPositions.indexOf(pos) !== -1) {
          classes[idx] = 'parity-bit';
          labels[idx] = 'P' + pos;
        } else {
          classes[idx] = 'data-bit';
          labels[idx] = 'D';
        }
      }

      html += '<h3>Encoded Hamming Code</h3>';
      html += renderBinaryDisplay(bits, { classes: classes, labels: labels });

      html += '<div class="result-info"><strong>Data:</strong> ' + result.data + ' → <strong>Encoded:</strong> ' + result.encoded + ' | <strong>Parity bits:</strong> ' + result.r + ' at positions ' + result.parityPositions.join(', ') + '</div>';

      // Hamming table
      html += '<div class="hamming-table"><table>';
      html += '<tr><th>Position</th>';
      for (var pos = 1; pos <= result.totalBits; pos++) html += '<th>' + pos + '</th>';
      html += '</tr>';

      // Binary position row
      html += '<tr><th>Binary</th>';
      for (var pos = 1; pos <= result.totalBits; pos++) {
        var binStr = padLeft(pos.toString(2), result.r);
        html += '<td>' + binStr + '</td>';
      }
      html += '</tr>';

      // Type row
      html += '<tr><th>Type</th>';
      for (var pos = 1; pos <= result.totalBits; pos++) {
        var isParity = result.parityPositions.indexOf(pos) !== -1;
        html += '<td class="' + (isParity ? 'parity-cell' : 'data-cell') + '">' + (isParity ? 'P' + pos : 'D') + '</td>';
      }
      html += '</tr>';

      // Value row
      html += '<tr><th>Value</th>';
      for (var pos = 1; pos <= result.totalBits; pos++) {
        var isParity = result.parityPositions.indexOf(pos) !== -1;
        html += '<td class="' + (isParity ? 'parity-cell' : 'data-cell') + '">' + result.encodedArray[pos] + '</td>';
      }
      html += '</tr></table></div>';

      // Error injection
      html += renderErrorInjection(result);
    } else {
      // Decode mode
      var bits = (result.correctedStr || result.received).split('');
      var classes = {};
      var labels = {};
      for (var pos = 1; pos <= result.totalBits; pos++) {
        var idx = pos - 1;
        if (result.errorPos === pos) {
          classes[idx] = 'corrected-bit';
          labels[idx] = '✓';
        } else if (result.parityPositions.indexOf(pos) !== -1) {
          classes[idx] = 'parity-bit';
          labels[idx] = 'P' + pos;
        } else {
          classes[idx] = 'data-bit';
          labels[idx] = 'D';
        }
      }

      html += '<h3>' + (result.errorPos > 0 ? 'Corrected' : 'Verified') + ' Code</h3>';
      html += renderBinaryDisplay(bits, { classes: classes, labels: labels });

      if (result.errorPos > 0) {
        html += '<div class="result-info" style="border-left:3px solid var(--danger)"><strong>Error found at position ' + result.errorPos + '!</strong> Bit flipped from ' + result.encoded[result.errorPos] + ' to ' + result.corrected[result.errorPos] + '. Data bits: <strong>' + result.dataBits + '</strong></div>';
      } else {
        html += '<div class="result-info" style="border-left:3px solid var(--success)"><strong>No error detected!</strong> Data bits: <strong>' + result.dataBits + '</strong></div>';
      }

      // Syndrome table
      html += '<div class="hamming-table"><table>';
      html += '<tr><th>Check</th><th>Positions</th><th>XOR Result</th><th>Status</th></tr>';
      for (var i = 0; i < result.syndromeDetails.length; i++) {
        var sd = result.syndromeDetails[i];
        html += '<tr>';
        html += '<td class="parity-cell">P' + sd.parityPos + '</td>';
        html += '<td>' + sd.covered.join(', ') + '</td>';
        html += '<td>' + sd.checkBit + '</td>';
        html += '<td class="' + (sd.checkBit !== 0 ? 'error-cell' : 'data-cell') + '">' + (sd.checkBit !== 0 ? '✗' : '✓') + '</td>';
        html += '</tr>';
      }
      html += '</table></div>';
    }

    // Steps
    html += '<details class="steps-details" open><summary>Step-by-Step ' + (result.mode === 'encode' ? 'Encoding' : 'Decoding') + '</summary>';
    html += '<div class="steps-content">' + renderStepsHTML(result.steps) + '</div>';
    html += '</details>';

    // Share
    html += renderShareSection(result);

    html += '</div>';
    return html;
  }

  // ===== ERROR INJECTION =====
  function renderErrorInjection(result) {
    var codeword;
    if (result.method === 'CRC') codeword = result.codeword;
    else if (result.method === 'Checksum') codeword = result.transmitted;
    else if (result.method === 'Hamming') codeword = result.encoded;
    else return '';

    var html = '<div class="error-injection" id="error-injection">';
    html += '<h3>🔧 Error Injection — Click a bit to flip it</h3>';

    var bits = codeword.split('');
    html += '<div class="binary-display" id="injection-bits">';
    for (var i = 0; i < bits.length; i++) {
      html += '<div class="bit data-bit" data-index="' + i + '" onclick="window.__flipBit(' + i + ')">' + bits[i] + '</div>';
    }
    html += '</div>';

    html += '<div class="injection-actions">';
    html += '<button class="btn btn-small btn-primary" onclick="window.__checkErrors()">Check for Errors</button>';
    html += '<button class="btn btn-small btn-secondary" onclick="window.__resetInjection()">Reset</button>';
    html += '<span id="flip-count" style="font-size:0.8rem;color:var(--text-muted)">No bits flipped</span>';
    html += '</div>';

    html += '<div class="injection-result" id="injection-result"></div>';
    html += '</div>';

    // Store state
    window.__injectionState = {
      original: codeword,
      current: codeword.split(''),
      flipped: new Array(codeword.length).fill(false),
      method: result.method,
      poly: result.poly,
      blockSize: result.blockSize,
      parityPositions: result.parityPositions,
      totalBits: result.totalBits
    };

    return html;
  }

  window.__flipBit = function (idx) {
    var state = window.__injectionState;
    if (!state) return;

    state.flipped[idx] = !state.flipped[idx];
    state.current[idx] = state.current[idx] === '0' ? '1' : '0';

    // Update display
    var bitEls = document.querySelectorAll('#injection-bits .bit');
    bitEls[idx].textContent = state.current[idx];
    bitEls[idx].classList.toggle('flipped', state.flipped[idx]);

    var count = state.flipped.filter(Boolean).length;
    document.getElementById('flip-count').textContent = count === 0 ? 'No bits flipped' : count + ' bit(s) flipped';
    document.getElementById('injection-result').innerHTML = '';
  };

  window.__resetInjection = function () {
    var state = window.__injectionState;
    if (!state) return;

    state.current = state.original.split('');
    state.flipped = new Array(state.original.length).fill(false);

    var bitEls = document.querySelectorAll('#injection-bits .bit');
    for (var i = 0; i < bitEls.length; i++) {
      bitEls[i].textContent = state.current[i];
      bitEls[i].classList.remove('flipped');
    }
    document.getElementById('flip-count').textContent = 'No bits flipped';
    document.getElementById('injection-result').innerHTML = '';
  };

  window.__checkErrors = function () {
    var state = window.__injectionState;
    if (!state) return;

    var received = state.current.join('');
    var resultDiv = document.getElementById('injection-result');
    var html = '';

    if (received === state.original) {
      html = '<div class="result-info" style="border-left:3px solid var(--success);margin-top:0.5rem"><strong>✓ No changes made</strong> — the codeword is identical to the original.</div>';
      resultDiv.innerHTML = html;
      return;
    }

    if (state.method === 'CRC') {
      var check = verifyCRC(received, state.poly);
      if (check.isValid) {
        html = '<div class="result-info" style="border-left:3px solid var(--warning);margin-top:0.5rem"><strong>⚠ No error detected</strong> — CRC remainder is 0. This error pattern is undetectable by this polynomial!</div>';
      } else {
        html = '<div class="result-info" style="border-left:3px solid var(--danger);margin-top:0.5rem"><strong>✗ Error detected!</strong> CRC remainder: <code>' + check.remainder + '</code> (non-zero)</div>';
      }
    } else if (state.method === 'Checksum') {
      var check = verifyChecksum(received, state.blockSize);
      if (check.isValid) {
        html = '<div class="result-info" style="border-left:3px solid var(--warning);margin-top:0.5rem"><strong>⚠ No error detected</strong> — checksum passes. This error pattern is undetectable!</div>';
      } else {
        html = '<div class="result-info" style="border-left:3px solid var(--danger);margin-top:0.5rem"><strong>✗ Error detected!</strong> Receiver sum: <code>' + check.sum + '</code> (not all 1s)</div>';
      }
    } else if (state.method === 'Hamming') {
      var decoded = hammingDecode(received);
      if (decoded.errorPos === 0) {
        html = '<div class="result-info" style="border-left:3px solid var(--warning);margin-top:0.5rem"><strong>⚠ No error detected by Hamming code</strong> — multiple bit errors may be undetectable.</div>';
      } else {
        var flippedCount = state.flipped.filter(Boolean).length;
        if (flippedCount === 1) {
          html = '<div class="result-info" style="border-left:3px solid var(--success);margin-top:0.5rem"><strong>✓ Error detected and corrected!</strong> Error at position <strong>' + decoded.errorPos + '</strong>. Corrected data: <code>' + decoded.dataBits + '</code></div>';
        } else {
          html = '<div class="result-info" style="border-left:3px solid var(--danger);margin-top:0.5rem"><strong>✗ Error detected at position ' + decoded.errorPos + '</strong>, but correction may be wrong (' + flippedCount + ' bits flipped — Hamming can only correct 1-bit errors).</div>';
        }
      }
    }

    resultDiv.innerHTML = html;
  };

  // ===== SHARE =====
  function renderShareSection(result) {
    var params = new URLSearchParams();
    params.set('method', result.method.toLowerCase());

    if (result.method === 'CRC') {
      params.set('data', result.data);
      params.set('poly', result.poly);
    } else if (result.method === 'Checksum') {
      params.set('data', result.data);
      params.set('bs', result.blockSize);
    } else if (result.method === 'Hamming') {
      params.set('mode', result.mode);
      params.set('data', result.mode === 'encode' ? result.data : result.received);
    }

    var url = window.location.origin + window.location.pathname + '?' + params.toString();

    var html = '<div class="share-section">';
    html += '<button class="btn btn-small btn-secondary" onclick="navigator.clipboard.writeText(document.getElementById(\'share-url\').value).then(function(){var b=event.target;b.textContent=\'Copied!\';setTimeout(function(){b.textContent=\'Share Link\'},1500)})">Share Link</button>';
    html += '<button class="btn btn-small btn-secondary" onclick="window.print()">🖨 Print</button>';
    html += '<input type="text" class="share-url" id="share-url" value="' + escapeHTML(url) + '" readonly>';
    html += '</div>';
    return html;
  }

  // ===== HISTORY =====
  var HISTORY_KEY = 'nc_network_history';

  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
    catch (e) { return []; }
  }

  function saveHistory(entry) {
    var history = loadHistory();
    history.unshift(entry);
    if (history.length > 50) history.length = 50;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    renderHistoryPanel();
  }

  function renderHistoryPanel() {
    var list = document.getElementById('history-list');
    var history = loadHistory();
    if (history.length === 0) {
      list.innerHTML = '<p class="history-empty">No calculations yet</p>';
      return;
    }
    var html = '';
    for (var i = 0; i < history.length; i++) {
      var h = history[i];
      html += '<div class="history-item" data-index="' + i + '">';
      html += '<div class="history-meta">';
      html += '<span class="history-method">' + h.method + '</span>';
      html += '<span class="history-size">' + (h.extra || '') + '</span>';
      html += '<span class="history-date">' + new Date(h.date).toLocaleDateString() + '</span>';
      html += '</div>';
      html += '<div class="history-preview">' + (h.data.length > 30 ? h.data.substring(0, 30) + '…' : h.data) + '</div>';
      html += '</div>';
    }
    list.innerHTML = html;

    list.querySelectorAll('.history-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var idx = parseInt(item.getAttribute('data-index'));
        var h = history[idx];
        if (!h) return;

        document.getElementById('method-select').value = h.method.toLowerCase();
        updateMethodUI();
        document.getElementById('data-input').value = h.data;

        if (h.method === 'CRC' && h.poly) {
          document.getElementById('poly-input').value = h.poly;
        } else if (h.method === 'Checksum' && h.blockSize) {
          document.getElementById('checksum-bits').value = h.blockSize;
        } else if (h.method === 'Hamming' && h.mode) {
          document.getElementById('hamming-mode').value = h.mode;
        }

        document.getElementById('history-panel').classList.remove('open');
      });
    });
  }

  // ===== THEME =====
  function initTheme() {
    var saved = localStorage.getItem('nc_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('nc_theme', next);
    updateThemeIcon(next);
  }

  function updateThemeIcon(theme) {
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  // ===== UI MANAGEMENT =====
  function updateMethodUI() {
    var method = document.getElementById('method-select').value;

    document.getElementById('poly-section').style.display = method === 'crc' ? 'block' : 'none';
    document.getElementById('crc-preset-group').style.display = method === 'crc' ? 'flex' : 'none';
    document.getElementById('checksum-bits-group').style.display = method === 'checksum' ? 'flex' : 'none';
    document.getElementById('hamming-mode-group').style.display = method === 'hamming' ? 'flex' : 'none';

    var dataLabel = document.getElementById('data-label');
    var dataHint = document.getElementById('data-hint');
    var dataInput = document.getElementById('data-input');

    if (method === 'crc') {
      dataLabel.textContent = 'Binary Data (Message)';
      dataHint.textContent = 'Enter the binary message to protect with CRC';
      dataInput.placeholder = 'e.g., 11010011101100';
    } else if (method === 'checksum') {
      dataLabel.textContent = 'Binary Data';
      dataHint.textContent = 'Enter binary data to compute checksum (will be split into blocks)';
      dataInput.placeholder = 'e.g., 1001001101100110';
    } else if (method === 'hamming') {
      var mode = document.getElementById('hamming-mode').value;
      if (mode === 'encode') {
        dataLabel.textContent = 'Data Bits to Encode';
        dataHint.textContent = 'Enter data bits (parity bits will be computed and inserted)';
        dataInput.placeholder = 'e.g., 1011001';
      } else {
        dataLabel.textContent = 'Received Hamming Code';
        dataHint.textContent = 'Enter the full received Hamming code (including parity bits) to check for errors';
        dataInput.placeholder = 'e.g., 10110010100';
      }
    }
  }

  function generateRandom() {
    var method = document.getElementById('method-select').value;

    if (method === 'crc') {
      var len = 8 + Math.floor(Math.random() * 8);
      var data = '';
      for (var i = 0; i < len; i++) data += Math.random() > 0.5 ? '1' : '0';
      if (data[0] === '0') data = '1' + data.substring(1);
      document.getElementById('data-input').value = data;

      var presets = ['1011', '10011', '110101'];
      document.getElementById('poly-input').value = presets[Math.floor(Math.random() * presets.length)];
    } else if (method === 'checksum') {
      var blockSize = parseInt(document.getElementById('checksum-bits').value);
      var blocks = 2 + Math.floor(Math.random() * 3);
      var data = '';
      for (var i = 0; i < blocks * blockSize; i++) data += Math.random() > 0.5 ? '1' : '0';
      document.getElementById('data-input').value = data;
    } else if (method === 'hamming') {
      var mode = document.getElementById('hamming-mode').value;
      if (mode === 'encode') {
        var len = 4 + Math.floor(Math.random() * 8);
        var data = '';
        for (var i = 0; i < len; i++) data += Math.random() > 0.5 ? '1' : '0';
        document.getElementById('data-input').value = data;
      } else {
        // Generate valid hamming code, maybe flip a bit
        var len = 4 + Math.floor(Math.random() * 4);
        var data = '';
        for (var i = 0; i < len; i++) data += Math.random() > 0.5 ? '1' : '0';
        var encoded = hammingEncode(data);
        var code = encoded.encoded.split('');
        if (Math.random() > 0.4) {
          var flipPos = Math.floor(Math.random() * code.length);
          code[flipPos] = code[flipPos] === '0' ? '1' : '0';
        }
        document.getElementById('data-input').value = code.join('');
      }
    }
  }

  // ===== MAIN CALCULATION =====
  function calculate() {
    var output = document.getElementById('output');
    var method = document.getElementById('method-select').value;
    var data = document.getElementById('data-input').value.trim();

    // Validate binary
    if (!data) {
      showError('Please enter binary data');
      return;
    }
    if (!isBinary(data)) {
      document.getElementById('data-input').classList.add('input-error');
      showError('Input must be binary (0s and 1s only)');
      return;
    }
    document.getElementById('data-input').classList.remove('input-error');

    var result;
    try {
      if (method === 'crc') {
        var poly = document.getElementById('poly-input').value.trim();
        if (!poly || !isBinary(poly)) {
          document.getElementById('poly-input').classList.add('input-error');
          showError('Generator polynomial must be binary');
          return;
        }
        if (poly[0] !== '1') {
          document.getElementById('poly-input').classList.add('input-error');
          showError('Generator polynomial must start with 1');
          return;
        }
        if (poly.length > data.length) {
          showError('Generator polynomial degree (' + (poly.length - 1) + ') must be less than data length (' + data.length + ')');
          return;
        }
        document.getElementById('poly-input').classList.remove('input-error');
        result = calculateCRC(data, poly);

        saveHistory({
          date: Date.now(),
          method: 'CRC',
          data: data,
          poly: poly,
          extra: 'poly:' + poly
        });
      } else if (method === 'checksum') {
        var blockSize = parseInt(document.getElementById('checksum-bits').value);
        result = calculateChecksum(data, blockSize);

        saveHistory({
          date: Date.now(),
          method: 'Checksum',
          data: data,
          blockSize: blockSize,
          extra: blockSize + '-bit'
        });
      } else if (method === 'hamming') {
        var mode = document.getElementById('hamming-mode').value;
        if (mode === 'encode') {
          result = hammingEncode(data);
        } else {
          result = hammingDecode(data);
        }

        saveHistory({
          date: Date.now(),
          method: 'Hamming',
          data: data,
          mode: mode,
          extra: mode
        });
      }
    } catch (err) {
      showError(err.message);
      return;
    }

    // Render
    var html = '';
    if (method === 'crc') html = renderCRCResult(result);
    else if (method === 'checksum') html = renderChecksumResult(result);
    else if (method === 'hamming') html = renderHammingResult(result);

    output.innerHTML = html;
    renderHistoryPanel();
  }

  function showError(msg) {
    document.getElementById('output').innerHTML = '<div class="error-message"><strong>Error:</strong> ' + msg + '</div>';
  }

  // ===== URL DECODE =====
  function decodeFromURL() {
    var params = new URLSearchParams(window.location.search);
    if (!params.has('method')) return null;

    var method = params.get('method');
    var data = params.get('data') || '';

    if (method === 'crc') {
      return { method: 'crc', data: data, poly: params.get('poly') || '' };
    } else if (method === 'checksum') {
      return { method: 'checksum', data: data, blockSize: params.get('bs') || '8' };
    } else if (method === 'hamming') {
      return { method: 'hamming', data: data, mode: params.get('mode') || 'encode' };
    }
    return null;
  }

  // ===== INITIALIZATION =====
  function init() {
    initTheme();

    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('method-select').addEventListener('change', updateMethodUI);
    document.getElementById('hamming-mode').addEventListener('change', updateMethodUI);
    document.getElementById('calculate-btn').addEventListener('click', calculate);
    document.getElementById('random-btn').addEventListener('click', generateRandom);
    document.getElementById('clear-btn').addEventListener('click', function () {
      document.getElementById('output').innerHTML = '';
      document.querySelectorAll('.input-error').forEach(function (el) { el.classList.remove('input-error'); });
    });
    document.getElementById('clear-history-btn').addEventListener('click', clearHistory);
    document.getElementById('history-toggle-btn').addEventListener('click', function () {
      document.getElementById('history-panel').classList.toggle('open');
    });

    // CRC preset
    document.getElementById('crc-preset').addEventListener('change', function () {
      var val = this.value;
      if (val !== 'custom') {
        document.getElementById('poly-input').value = val;
      }
    });

    updateMethodUI();
    renderHistoryPanel();

    // URL params
    var urlData = decodeFromURL();
    if (urlData) {
      document.getElementById('method-select').value = urlData.method;
      updateMethodUI();
      document.getElementById('data-input').value = urlData.data;

      if (urlData.method === 'crc' && urlData.poly) {
        document.getElementById('poly-input').value = urlData.poly;
      } else if (urlData.method === 'checksum' && urlData.blockSize) {
        document.getElementById('checksum-bits').value = urlData.blockSize;
      } else if (urlData.method === 'hamming' && urlData.mode) {
        document.getElementById('hamming-mode').value = urlData.mode;
        updateMethodUI();
      }

      setTimeout(calculate, 100);
    }

    // Keyboard shortcut
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.ctrlKey) calculate();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
