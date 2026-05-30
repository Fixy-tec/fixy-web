"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidTagIdsError = void 0;
exports.createRequest = createRequest;
exports.getRequests = getRequests;
exports.getRequestById = getRequestById;
exports.updateRequest = updateRequest;
exports.deleteRequest = deleteRequest;
const requestsRepository = __importStar(require("../repositories/requests.repository"));
const tagRepository = __importStar(require("../../tags/repositories/tag.repository"));
class InvalidTagIdsError extends Error {
    constructor() {
        super("Uno o más tags no existen en el catálogo");
        this.name = "InvalidTagIdsError";
    }
}
exports.InvalidTagIdsError = InvalidTagIdsError;
async function resolveTagIds(tagIdsOrNames) {
    const unique = [
        ...new Set(tagIdsOrNames.map((id) => id.trim()).filter((id) => id.length > 0)),
    ];
    if (unique.length === 0)
        return [];
    const byId = await tagRepository.findTagsByIds(unique);
    if (byId.length === unique.length) {
        return byId.map((t) => t.id);
    }
    const byName = await tagRepository.findTagsByNames(unique);
    if (byName.length !== unique.length) {
        throw new InvalidTagIdsError();
    }
    return byName.map((t) => t.id);
}
async function createRequest(input) {
    if (!input.title || !input.description) {
        throw new Error("Title and description are required");
    }
    if (input.difficulty < 1 || input.difficulty > 5) {
        throw new Error("Difficulty must be between 1 and 5");
    }
    if (input.basePoints < 0) {
        throw new Error("Base points must be 0 or greater");
    }
    if (input.participantsNeeded < 1) {
        throw new Error("At least 1 participant is required");
    }
    if (!input.tagIds?.length) {
        throw new Error("At least one tag is required");
    }
    // For ASESORIA type, force participantsNeeded to 1
    if (input.type === "ASESORIA" && input.participantsNeeded !== 1) {
        input.participantsNeeded = 1;
    }
    // Validate max 5 requests per user
    const userRequestCount = await requestsRepository.getUserRequestCount(input.creatorId);
    if (userRequestCount >= 5) {
        throw new Error("Users can have a maximum of 5 active requests");
    }
    const tagIds = await resolveTagIds(input.tagIds);
    return requestsRepository.createRequest({ ...input, tagIds });
}
async function getRequests(filters) {
    return requestsRepository.getRequests(filters);
}
async function getRequestById(id) {
    const request = await requestsRepository.getRequestById(id);
    if (!request) {
        throw new Error("Request not found");
    }
    return request;
}
async function updateRequest(id, input) {
    const request = await requestsRepository.getRequestById(id);
    if (!request) {
        throw new Error("Request not found");
    }
    if (input.difficulty !== undefined) {
        if (input.difficulty < 1 || input.difficulty > 5) {
            throw new Error("Difficulty must be between 1 and 5");
        }
    }
    if (input.basePoints !== undefined) {
        if (input.basePoints < 0) {
            throw new Error("Base points must be greater than 0");
        }
    }
    if (input.participantsNeeded !== undefined) {
        if (input.participantsNeeded < 1) {
            throw new Error("At least 1 participant is required");
        }
        // For ASESORIA type, ensure participantsNeeded is 1
        if (request.type === "ASESORIA" && input.participantsNeeded !== 1) {
            input.participantsNeeded = 1;
        }
    }
    let tagIds = undefined;
    if (input.tagIds !== undefined) {
        if (input.tagIds.length === 0) {
            throw new Error("At least one tag is required");
        }
        tagIds = await resolveTagIds(input.tagIds);
    }
    return requestsRepository.updateRequest(id, { ...input, tagIds });
}
async function deleteRequest(id) {
    const request = await requestsRepository.getRequestById(id);
    if (!request) {
        throw new Error("Request not found");
    }
    return requestsRepository.deleteRequest(id);
}
